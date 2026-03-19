/**
 * Seed script: populates MongoDB with Authors, Posts, and Comments.
 *
 * Authors: loaded from data/instagram-influencers.csv (Kaggle dataset).
 * Posts:   5-10 category-matched Unsplash images per author.
 * Comments: 1-3 realistic comments seeded per post.
 *
 * Run: npm run seed
 * Safe to re-run — skips existing authors, clears and recreates posts/comments.
 */
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const { parse } = require('csv-parse/sync')
const mongoose = require('mongoose')
const Author = require('../models/author')
const Post = require('../models/post')
const Comment = require('../models/comment')

const DATA_DIR = path.join(__dirname, '..', 'data')
const INSTAGRAM_CSV = path.join(DATA_DIR, 'instagram-influencers.csv')
const SEED_JSON = path.join(DATA_DIR, 'seed-authors.json')

// Profile + post images from Kaggle Celebrity Database (filter-and-import-kaggle.js)
let PROFILE_IMAGES = {}
let POST_IMAGES = {}
try {
  PROFILE_IMAGES = require(path.join(DATA_DIR, 'profile-images.js'))
} catch (_) {}
try {
  POST_IMAGES = require(path.join(DATA_DIR, 'post-images.js'))
} catch (_) {}

// Usernames that skip celebrity dataset — use Unsplash only (no local profile/post images)
const USE_UNSPLASH_ONLY = new Set(['nba'])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(str) {
  return String(str).toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '').slice(0, 50) || 'user'
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function sample(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(n, arr.length))
}

function parseCount(str) {
  if (!str) return 0
  const s = String(str).trim().toUpperCase()
  if (s.endsWith('M')) return Math.round(parseFloat(s) * 1_000_000)
  if (s.endsWith('K')) return Math.round(parseFloat(s) * 1_000)
  return Math.round(parseFloat(s)) || 0
}

function parseRate(str) {
  if (!str) return 0
  return parseFloat(String(str).replace('%', '').trim()) || 0
}

// ---------------------------------------------------------------------------
// Category map — username (lowercase) → category
// ---------------------------------------------------------------------------

const CATEGORY_MAP = {
  // ── Football / Soccer ──────────────────────────────────────────────────
  cristiano: 'football', leomessi: 'football', neymarjr: 'football',
  'k.mbappe': 'football', realmadrid: 'football', fcbarcelona: 'football',
  sergioramos: 'football', mosalah: 'football', karimbenzema: 'football',
  paulpogba: 'football', iamzlatanibrahimovic: 'football',
  manchesterunited: 'football', juventus: 'football', psg: 'football',
  paulodybala: 'football', marcelotwelve: 'football',
  jamesrodriguez10: 'football', garethbale11: 'football',
  andresiniesta8: 'football', antogriezmann: 'football',
  luissuarez9: 'football', nikefootball: 'football', '433': 'football',
  liverpoolfc: 'football', 'toni.kr8s': 'football', zidane: 'football',
  'j.m': 'football', ronaldinho: 'football',

  // ── Basketball ──────────────────────────────────────────────────────────
  kingjames: 'basketball', nba: 'basketball', stephencurry30: 'basketball',

  // ── MMA / Combat Sports ─────────────────────────────────────────────────
  thenotoriousmma: 'mma', khabib_nurmagomedov: 'mma',

  // ── Cricket ─────────────────────────────────────────────────────────────
  'virat.kohli': 'cricket', sachintendulkar: 'cricket',

  // ── Music ───────────────────────────────────────────────────────────────
  selenagomez: 'music', arianagrande: 'music', beyonce: 'music',
  justinbieber: 'music', taylorswift: 'music', jlo: 'music',
  nickiminaj: 'music', mileycyrus: 'music', billieeilish: 'music',
  dualipa: 'music', shakira: 'music', nehakakkar: 'music',
  shawnmendes: 'music', jennierubyjane: 'music', 'bts.bighitofficial': 'music',
  justintimberlake: 'music', camila_cabello: 'music', anitta: 'music',
  'sooyaaa__': 'music', maluma: 'music', 'roses_are_rosie': 'music',
  karolg: 'music', ladygaga: 'music', adele: 'music',
  jbalvin: 'music', daddyyankee: 'music', harrystyles: 'music',
  zayn: 'music', travisscott: 'music', nickyjampr: 'music',
  badbunnypr: 'music', britneyspears: 'music', mariliamendoncacantora: 'music',
  theweeknd: 'music', eminem: 'music', nattinatasha: 'music',
  iambeckyg: 'music', nancyajram: 'music', luansantana: 'music',
  nickjonas: 'music', simonemendes: 'music', ivetesangalo: 'music',
  gusttavolima: 'music', wesleysafadao: 'music', dannapaola: 'music',
  blackpinkofficial: 'music', champagnepapi: 'music',
  chrisbrownofficial: 'music', snoopdogg: 'music', wizkhalifa: 'music',
  '50cent': 'music',

  // ── Fashion / Beauty ────────────────────────────────────────────────────
  kyliejenner: 'fashion', kimkardashian: 'fashion', khloekardashian: 'fashion',
  kendalljenner: 'fashion', kourtneykardash: 'fashion', gigihadid: 'fashion',
  bellahadid: 'fashion', victoriassecret: 'fashion', hudabeauty: 'fashion',
  krisjenner: 'fashion', haileybieber: 'fashion', caradelevingne: 'fashion',
  gucci: 'fashion', louisvuitton: 'fashion', dior: 'fashion',
  hm: 'fashion', adidasoriginals: 'fashion', shaymitchell: 'fashion',
  vanessahudgens: 'fashion', dovecameron: 'fashion', blakelively: 'fashion',
  georginagio: 'fashion', norafatehi: 'fashion',

  // ── Fitness / Sports ────────────────────────────────────────────────────
  therock: 'fitness', chrishemsworth: 'fitness', danbilzerian: 'fitness',
  nike: 'fitness',

  // ── Bollywood / Indian Cinema ───────────────────────────────────────────
  priyankachopra: 'bollywood', shraddhakapoor: 'bollywood',
  aliaabhatt: 'bollywood', deepikapadukone: 'bollywood',
  katrinakaif: 'bollywood', beingsalmankhan: 'bollywood',
  sunnyleone: 'bollywood', dishapatani: 'bollywood',
  akshaykumar: 'bollywood', jacquelinef143: 'bollywood',
  anushkasharma: 'bollywood', kritisanon: 'bollywood',
  anushkasen0408: 'bollywood', tigerjackieshroff: 'bollywood',
  varundvn: 'bollywood', hrithikroshan: 'bollywood',
  shahidkapoor: 'bollywood', sonamkapoor: 'bollywood',
  parineetichopra: 'bollywood', ranveersingh: 'bollywood',
  jannatzubair29: 'bollywood', kapilsharma: 'bollywood',
  raisa6690: 'bollywood', raffinagita1717: 'bollywood',
  ayutingting92: 'bollywood', mahi7781: 'bollywood',
  laudyacynthiabella: 'bollywood', princessyahrini: 'bollywood',
  natashawilona12: 'bollywood', lunamaya: 'bollywood',
  ruben_onsu: 'bollywood', jokowi: 'bollywood',
  prillylatuconsina96: 'bollywood',

  // ── Food ────────────────────────────────────────────────────────────────
  cznburak: 'food', nusr_et: 'food', buzzfeedtasty: 'food',
  chrissyteigen: 'food',

  // ── Nature / Geography ──────────────────────────────────────────────────
  natgeo: 'nature', natgeotravel: 'nature', teddysphotos: 'nature',
  leonardodicaprio: 'nature',

  // ── Space / Science ─────────────────────────────────────────────────────
  nasa: 'space',

  // ── Cars / Luxury ───────────────────────────────────────────────────────
  mercedesbenz: 'cars', bmw: 'cars',

  // ── Entertainment / Movies ──────────────────────────────────────────────
  marvel: 'entertainment', marvelstudios: 'entertainment',
  disney: 'entertainment', worldstar: 'entertainment',
  '9gag': 'entertainment', lelepons: 'entertainment',

  // ── Actors ──────────────────────────────────────────────────────────────
  gal_gadot: 'actor', vindiesel: 'actor', emmawatson: 'actor',
  tomholland2013: 'actor', milliebobbybrown: 'actor', zacefron: 'actor',
  willsmith: 'actor', robertdowneyjr: 'actor', zendaya: 'actor',
  colesprouse: 'actor', jenniferaniston: 'actor', prattprattpratt: 'actor',
  kevinhart4real: 'actor', theellenshow: 'actor',

  // ── Politics ────────────────────────────────────────────────────────────
  narendramodi: 'politics', barackobama: 'politics', michelleobama: 'politics',

  // ── Dance ───────────────────────────────────────────────────────────────
  charlidamelio: 'dance', whinderssonnunes: 'dance',
  '5-minute crafts girly': 'dance',

  // ── Brazilian Entertainment ─────────────────────────────────────────────
  tatawerneck: 'music', maisa: 'music', brunamarquezine: 'fashion',
  marinaruybarbosa: 'fashion', paollaoliveirareal: 'fashion',
  larissamanoela: 'music', gisel_la: 'fashion',

  // ── Lifestyle ───────────────────────────────────────────────────────────
  addisonraee: 'lifestyle', iamcardib: 'lifestyle', ddlovato: 'music',
  badgalriri: 'fashion', 'lalalalisa_m': 'dance',
}

// ---------------------------------------------------------------------------
// Category-specific post templates
// ---------------------------------------------------------------------------

const CATEGORY_TEMPLATES = {

  football: [
    { caption: 'Nothing beats the feeling of scoring in front of 90,000 fans. ⚽🔥', imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800', hashtags: ['football', 'soccer', 'goals'], likesCount: 245000 },
    { caption: 'Another day, another training session. The grind never stops. 💪', imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', hashtags: ['football', 'training', 'dedication'], likesCount: 188000 },
    { caption: 'The stadium is our second home. 🏟️', imageUrl: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800', hashtags: ['football', 'stadium', 'matchday'], likesCount: 312000 },
    { caption: 'Celebrating with the team — this is what it\'s all about. 🏆', imageUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800', hashtags: ['football', 'teamwork', 'champions'], likesCount: 420000 },
    { caption: 'Game day is the best day. Ready for 90 minutes of everything. ⚡', imageUrl: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=800', hashtags: ['football', 'gameday', 'matchday'], likesCount: 275000 },
    { caption: 'The ball is round. Anything can happen. 🔮⚽', imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c643e7486?w=800', hashtags: ['football', 'soccer', 'passion'], likesCount: 195000 },
    { caption: 'Focused. Ready. Let\'s go. 🎯', imageUrl: 'https://images.unsplash.com/photo-1529422643029-d4585747aaf2?w=800', hashtags: ['football', 'focus', 'training'], likesCount: 163000 },
    { caption: 'Win or learn — never lose. 💯', imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc595a4900?w=800', hashtags: ['football', 'mindset', 'mentality'], likesCount: 287000 },
    { caption: 'Early morning sessions hit different when you\'re hungry for success. 🌅', imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800', hashtags: ['football', 'morningtraining', 'grind'], likesCount: 145000 },
    { caption: 'The love for this game started when I was 5 years old. Still the same fire. ❤️🔥', imageUrl: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800', hashtags: ['football', 'passion', 'love'], likesCount: 398000 },
  ],

  basketball: [
    { caption: 'Hoops are life. 🏀🔥', imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', hashtags: ['basketball', 'nba', 'hoops'], likesCount: 320000 },
    { caption: 'Early morning work before the world wakes up. Consistency is key. 💪', imageUrl: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800', hashtags: ['basketball', 'training', 'grind'], likesCount: 245000 },
    { caption: 'The court is my canvas. 🎨', imageUrl: 'https://images.unsplash.com/photo-1519861531473-28aa21b0f58b?w=800', hashtags: ['basketball', 'court', 'game'], likesCount: 178000 },
    { caption: 'Championship mentality every single day. 🏆', imageUrl: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800', hashtags: ['basketball', 'champion', 'mentality'], likesCount: 412000 },
    { caption: 'From the streets to the arena. Grateful for every moment. 🙏', imageUrl: 'https://images.unsplash.com/photo-1583586658723-b48cfe3df5f5?w=800', hashtags: ['basketball', 'grateful', 'journey'], likesCount: 356000 },
    { caption: 'Game faces on. It\'s time. ⚡🏀', imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', hashtags: ['basketball', 'gameday', 'nba'], likesCount: 293000 },
    { caption: 'The secret? 1,000 extra shots every day when no one is watching. 🎯', imageUrl: 'https://images.unsplash.com/photo-1519861531473-28aa21b0f58b?w=800', hashtags: ['basketball', 'dedication', 'shooting'], likesCount: 267000 },
    { caption: 'NBA Finals energy. This is what we work for. 🏆', imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800', hashtags: ['nba', 'basketball', 'finals'], likesCount: 489000 },
    { caption: 'Ball is life. Every practice, every game. 🏀', imageUrl: 'https://images.unsplash.com/photo-1560153778-0e1c4f0096c4?w=800', hashtags: ['nba', 'basketball', 'ballislife'], likesCount: 412000 },
    { caption: 'Arena lights. Nothing like game night. 🌟', imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800', hashtags: ['nba', 'basketball', 'gamenight'], likesCount: 378000 },
    { caption: 'Swiish. That sound never gets old. 🎯', imageUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800', hashtags: ['nba', 'basketball', 'shooting'], likesCount: 356000 },
  ],

  mma: [
    { caption: 'Train hard. Fight easy. 🥊', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', hashtags: ['mma', 'boxing', 'training'], likesCount: 198000 },
    { caption: 'Fear no man. Respect every opponent. 🦁', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', hashtags: ['mma', 'fighter', 'discipline'], likesCount: 342000 },
    { caption: 'The octagon is where legends are made. 🏆', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800', hashtags: ['mma', 'ufc', 'champion'], likesCount: 276000 },
    { caption: 'Morning sparring. Nothing sharpens the mind like this. 💪', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', hashtags: ['mma', 'sparring', 'boxing'], likesCount: 187000 },
    { caption: 'Every scar tells a story of hard work and sacrifice. 🔥', imageUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800', hashtags: ['mma', 'warrior', 'sacrifice'], likesCount: 231000 },
    { caption: 'Undefeated mentality. Grind until greatness. ⚡', imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800', hashtags: ['mma', 'greatness', 'grind'], likesCount: 415000 },
  ],

  cricket: [
    { caption: 'The crease is where I come alive. 🏏🔥', imageUrl: 'https://images.unsplash.com/photo-1540747913346-19212a4b5e5e?w=800', hashtags: ['cricket', 'batting', 'sport'], likesCount: 287000 },
    { caption: 'Playing for the billion. Every run counts. 🇮🇳', imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800', hashtags: ['cricket', 'india', 'teamwork'], likesCount: 412000 },
    { caption: 'This pitch has seen countless battles. Honoured to play on it. 🏟️', imageUrl: 'https://images.unsplash.com/photo-1504095197-eee8fd23e88a?w=800', hashtags: ['cricket', 'pitch', 'stadium'], likesCount: 198000 },
    { caption: 'Not just a game. A way of life. 🏆', imageUrl: 'https://images.unsplash.com/photo-1562077772-3bd90403f7f0?w=800', hashtags: ['cricket', 'passion', 'lifestyle'], likesCount: 367000 },
    { caption: 'Early nets session before the rest of the world wakes up. 🌅', imageUrl: 'https://images.unsplash.com/photo-1574271143515-5cddf8da19be?w=800', hashtags: ['cricket', 'training', 'dedication'], likesCount: 245000 },
    { caption: 'Boundaries don\'t build legends. Discipline does. 💯', imageUrl: 'https://images.unsplash.com/photo-1540747913346-19212a4b5e5e?w=800', hashtags: ['cricket', 'mindset', 'champion'], likesCount: 321000 },
  ],

  music: [
    { caption: 'Late night studio sessions are where the magic happens. 🎵✨', imageUrl: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800', hashtags: ['music', 'studio', 'newmusic'], likesCount: 342000 },
    { caption: 'The crowd energy tonight was UNREAL. Thank you for everything. 🙌🔥', imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800', hashtags: ['concert', 'livemusic', 'tour'], likesCount: 876000 },
    { caption: 'New music is coming. And you\'re not ready. 👀🎧', imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800', hashtags: ['newmusic', 'comingsoon', 'music'], likesCount: 1200000 },
    { caption: 'This microphone has heard my deepest truths. 🎤💛', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800', hashtags: ['music', 'singing', 'soul'], likesCount: 445000 },
    { caption: 'Sold out every night. This tour has changed me forever. 🌍', imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800', hashtags: ['tour', 'concert', 'soldout'], likesCount: 923000 },
    { caption: 'The fans are the reason I do this. Every single one of you. ❤️', imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800', hashtags: ['fans', 'grateful', 'music'], likesCount: 756000 },
    { caption: 'Music is the only language that needs no translation. 🌐🎶', imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', hashtags: ['music', 'art', 'culture'], likesCount: 534000 },
    { caption: 'Writing songs at 3am hits different. Raw and real. ✍️🌙', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800', hashtags: ['songwriting', 'music', 'creative'], likesCount: 389000 },
    { caption: 'Backstage vibes before showtime. Deep breaths, let\'s go. 🎭', imageUrl: 'https://images.unsplash.com/photo-1563330232-57c13d06cf29?w=800', hashtags: ['backstage', 'concert', 'performance'], likesCount: 612000 },
    { caption: 'Album drop coming soon. This one is deeply personal. 💿', imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', hashtags: ['album', 'newmusic', 'music'], likesCount: 1450000 },
  ],

  fashion: [
    { caption: 'Style is a way to say who you are without speaking. 👗✨', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800', hashtags: ['fashion', 'style', 'ootd'], likesCount: 567000 },
    { caption: 'Front row at Fashion Week and still pinching myself. 🌟', imageUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800', hashtags: ['fashionweek', 'runway', 'fashion'], likesCount: 789000 },
    { caption: 'This look took 3 hours to perfect. Worth every second. 💄', imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800', hashtags: ['fashion', 'beauty', 'glam'], likesCount: 456000 },
    { caption: 'New collab announcement coming Thursday. The wait is over. 👀', imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800', hashtags: ['collab', 'fashion', 'newdrop'], likesCount: 934000 },
    { caption: 'The dress was custom. The confidence is all me. 💋', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800', hashtags: ['fashion', 'selfconfidence', 'style'], likesCount: 1120000 },
    { caption: 'Keeping it minimal today. Less is more. 🤍', imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800', hashtags: ['minimalfashion', 'style', 'clean'], likesCount: 342000 },
    { caption: 'Editorial dreams. Shot by the most incredible team. 📸', imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800', hashtags: ['editorial', 'fashion', 'photography'], likesCount: 678000 },
    { caption: 'No rules in fashion. Only vibes. 🔥', imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800', hashtags: ['fashion', 'vibes', 'style'], likesCount: 445000 },
    { caption: 'Dressed by the best. Feeling unstoppable. 👑', imageUrl: 'https://images.unsplash.com/photo-1558171813-8b25a5b8e5c8?w=800', hashtags: ['fashion', 'luxury', 'designer'], likesCount: 823000 },
    { caption: 'New season, new energy. Spring collection is here. 🌸', imageUrl: 'https://images.unsplash.com/photo-1479064555552-3ef4d0d66b9b?w=800', hashtags: ['fashion', 'newseason', 'spring'], likesCount: 512000 },
  ],

  fitness: [
    { caption: 'The only bad workout is the one you didn\'t do. 💪🔥', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', hashtags: ['fitness', 'gym', 'motivation'], likesCount: 287000 },
    { caption: '5am club. This is where champions are built. ⏰💪', imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', hashtags: ['gym', 'fitness', 'dedication'], likesCount: 341000 },
    { caption: 'Leg day is not optional. It\'s mandatory. 🦵🏋️', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800', hashtags: ['legday', 'gym', 'fitness'], likesCount: 198000 },
    { caption: 'Body transformation takes time. Trust the process. 🙏', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800', hashtags: ['transformation', 'fitness', 'progress'], likesCount: 423000 },
    { caption: 'PR day. New personal record. Always raising the bar. 📈', imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800', hashtags: ['personalrecord', 'gym', 'gains'], likesCount: 267000 },
    { caption: 'Run until your lungs give thanks. 🏃‍♂️🌅', imageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800', hashtags: ['running', 'fitness', 'cardio'], likesCount: 312000 },
    { caption: 'Rest is part of the program. Recovery is progress. 😴💪', imageUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800', hashtags: ['recovery', 'fitness', 'health'], likesCount: 234000 },
    { caption: 'Iron never lies. What you put in is what you get back. 🏋️', imageUrl: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800', hashtags: ['fitness', 'weightlifting', 'gym'], likesCount: 389000 },
    { caption: 'This gym is my therapy. Every rep a little bit of peace. 🧘', imageUrl: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=800', hashtags: ['gym', 'mentalhealth', 'fitness'], likesCount: 445000 },
    { caption: 'Consistent over perfect. Show up every single day. 📅', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', hashtags: ['consistency', 'gym', 'fitness'], likesCount: 356000 },
  ],

  bollywood: [
    { caption: 'Between every shot, gratitude. This journey is a blessing. 🙏✨', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', hashtags: ['bollywood', 'india', 'cinema'], likesCount: 456000 },
    { caption: 'On set vibes. Lights, camera, action! 🎬🎥', imageUrl: 'https://images.unsplash.com/photo-1524492412435-03e42c72b11d?w=800', hashtags: ['bollywood', 'onset', 'films'], likesCount: 678000 },
    { caption: 'India never ceases to take my breath away. 🌺🇮🇳', imageUrl: 'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800', hashtags: ['india', 'culture', 'travel'], likesCount: 534000 },
    { caption: 'Grateful for 10 years of this dream. From auditions to awards. 🏆', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', hashtags: ['bollywood', 'grateful', 'decade'], likesCount: 892000 },
    { caption: 'Dance is the hidden language of the soul. 💃🎶', imageUrl: 'https://images.unsplash.com/photo-1568454537842-d933259bb258?w=800', hashtags: ['dance', 'bollywood', 'expression'], likesCount: 412000 },
    { caption: 'The trailer is out. Link in bio. This one is special. 🎞️👀', imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', hashtags: ['bollywood', 'newfilm', 'trailer'], likesCount: 1200000 },
    { caption: 'Wrapped! That\'s a film in the can. What a ride. 🎬❤️', imageUrl: 'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800', hashtags: ['bollywood', 'filmwrap', 'cinema'], likesCount: 756000 },
    { caption: 'Every festival in India reminds me why I love my culture. 🪔', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800', hashtags: ['india', 'festival', 'culture'], likesCount: 623000 },
    { caption: 'Character prep starts weeks before shooting begins. Dedication. 📚', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', hashtags: ['acting', 'bollywood', 'preparation'], likesCount: 345000 },
    { caption: 'Box office numbers don\'t matter when the audience cries and laughs with you. ❤️', imageUrl: 'https://images.unsplash.com/photo-1524492412435-03e42c72b11d?w=800', hashtags: ['bollywood', 'films', 'emotions'], likesCount: 567000 },
  ],

  food: [
    { caption: 'This dish took 4 hours to prepare. Every second worth it. 🍽️✨', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800', hashtags: ['food', 'cooking', 'chef'], likesCount: 234000 },
    { caption: 'Street food is the soul food of every culture. 🌮🔥', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', hashtags: ['streetfood', 'food', 'travel'], likesCount: 189000 },
    { caption: 'The secret ingredient is always love. And a little butter. 🧈❤️', imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800', hashtags: ['cooking', 'food', 'homemade'], likesCount: 312000 },
    { caption: 'New recipe alert. Full video goes up tomorrow. 📱🍳', imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', hashtags: ['recipe', 'food', 'cooking'], likesCount: 276000 },
    { caption: 'Healthy eating is not a punishment — it\'s a gift to yourself. 🥗', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', hashtags: ['healthyfood', 'nutrition', 'wellness'], likesCount: 198000 },
    { caption: 'Gourmet on a Tuesday because why not. 🍷🕯️', imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800', hashtags: ['gourmet', 'food', 'finedining'], likesCount: 245000 },
    { caption: 'This burger changed my life and I will not be taking questions. 🍔😍', imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', hashtags: ['burger', 'food', 'foodie'], likesCount: 356000 },
    { caption: 'World food tour continues. This city won my heart through its food. 🌍🍜', imageUrl: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800', hashtags: ['foodtravel', 'worldcuisine', 'foodie'], likesCount: 289000 },
    { caption: 'Dessert first. Always. 🍰', imageUrl: 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=800', hashtags: ['dessert', 'sweet', 'food'], likesCount: 412000 },
    { caption: 'Restaurant opening next month. The menu will blow your minds. 👀', imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', hashtags: ['restaurant', 'chef', 'food'], likesCount: 534000 },
  ],

  nature: [
    { caption: 'The wild reminds us we are guests on this planet. 🦁🌍', imageUrl: 'https://images.unsplash.com/photo-1466721591366-2d5fba72006d?w=800', hashtags: ['wildlife', 'nature', 'conservation'], likesCount: 412000 },
    { caption: 'Captured at golden hour in the Serengeti. A moment I\'ll never forget. 📸🌅', imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800', hashtags: ['nature', 'wildlife', 'africa'], likesCount: 567000 },
    { caption: 'This planet is worth fighting for. Protect our oceans. 🌊🐋', imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800', hashtags: ['ocean', 'conservation', 'nature'], likesCount: 689000 },
    { caption: 'Mountains have a way of humbling the proudest souls. 🏔️', imageUrl: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800', hashtags: ['mountains', 'nature', 'hiking'], likesCount: 378000 },
    { caption: 'The forest is never really quiet if you learn to listen. 🌲', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', hashtags: ['forest', 'nature', 'mindfulness'], likesCount: 445000 },
    { caption: 'Face to face with a wild fox. Nature never disappoints. 🦊', imageUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800', hashtags: ['wildlife', 'fox', 'nature'], likesCount: 623000 },
    { caption: 'Three weeks in the bush. This is what resets the soul. 🌿', imageUrl: 'https://images.unsplash.com/photo-1534759846116-5799c33ce22a?w=800', hashtags: ['nature', 'safari', 'wildlife'], likesCount: 534000 },
    { caption: 'Every animal has a story. Our job is to protect them. 🐘', imageUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800', hashtags: ['wildlife', 'elephant', 'conservation'], likesCount: 712000 },
    { caption: 'Wild and free. The way it should be. 🦅', imageUrl: 'https://images.unsplash.com/photo-1418517787037-db6f3b633b08?w=800', hashtags: ['nature', 'wild', 'freedom'], likesCount: 389000 },
    { caption: 'Gorillas in the mist. This encounter changed everything. 🦍', imageUrl: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800', hashtags: ['gorilla', 'wildlife', 'nature'], likesCount: 823000 },
  ],

  space: [
    { caption: 'From this vantage point, all borders disappear. 🌍✨', imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800', hashtags: ['space', 'earth', 'nasa'], likesCount: 890000 },
    { caption: 'Today we launched a new chapter in human exploration. 🚀', imageUrl: 'https://images.unsplash.com/photo-1446776709462-d6b525c57bd3?w=800', hashtags: ['nasa', 'space', 'launch'], likesCount: 1240000 },
    { caption: 'The universe is under no obligation to make sense to you. But look anyway. 🔭', imageUrl: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=800', hashtags: ['space', 'astronomy', 'science'], likesCount: 756000 },
    { caption: 'Stars you see tonight formed billions of years ago. Let that sink in. ⭐', imageUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800', hashtags: ['stars', 'space', 'universe'], likesCount: 934000 },
    { caption: 'New images from deep space. Humanity\'s eye in the cosmos. 🌌', imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800', hashtags: ['space', 'telescope', 'nasa'], likesCount: 1120000 },
    { caption: 'Humans are the only species that looks up and wonders. Don\'t stop wondering. 🛸', imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800', hashtags: ['space', 'science', 'exploration'], likesCount: 678000 },
    { caption: 'Rocket systems nominal. Launch window opens in T-3 hours. ⏱️🚀', imageUrl: 'https://images.unsplash.com/photo-1446776709462-d6b525c57bd3?w=800', hashtags: ['nasa', 'rocket', 'launch'], likesCount: 2100000 },
  ],

  cars: [
    { caption: 'Pure engineering. Pure emotion. 🏎️🔥', imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', hashtags: ['cars', 'luxury', 'automotive'], likesCount: 345000 },
    { caption: 'Every detail crafted to perfection. This is art on four wheels. 🎨', imageUrl: 'https://images.unsplash.com/photo-1617718616539-8a7c8da6e0d8?w=800', hashtags: ['cars', 'design', 'luxury'], likesCount: 289000 },
    { caption: 'Zero to 100 in 3.2 seconds. Physics never felt this good. ⚡', imageUrl: 'https://images.unsplash.com/photo-1544636331-9849b5a30e47?w=800', hashtags: ['cars', 'performance', 'speed'], likesCount: 412000 },
    { caption: 'The future of driving is electric. And it\'s extraordinary. 🔋🚗', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', hashtags: ['cars', 'electric', 'future'], likesCount: 534000 },
    { caption: 'Built to perform. Designed to inspire. 🏁', imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', hashtags: ['cars', 'sports', 'automotive'], likesCount: 378000 },
    { caption: 'The road is not just a path. It\'s a story waiting to be driven. 🛣️', imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', hashtags: ['cars', 'roadtrip', 'lifestyle'], likesCount: 256000 },
  ],

  actor: [
    { caption: 'Filming wrapped today. This character lived in me for 8 months. 🎬', imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800', hashtags: ['acting', 'film', 'actor'], likesCount: 678000 },
    { caption: 'Award season prep is officially ON. Big things ahead. 🏆✨', imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b92803e?w=800', hashtags: ['awards', 'redcarpet', 'film'], likesCount: 923000 },
    { caption: 'From script to screen. The process is where the magic is. 🎭', imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800', hashtags: ['acting', 'filmmaking', 'cinema'], likesCount: 456000 },
    { caption: 'The best stories are the ones that change you. New trailer is out. 🎞️', imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800', hashtags: ['film', 'trailer', 'cinema'], likesCount: 1340000 },
    { caption: 'In character and loving every second of it. 🎥', imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800', hashtags: ['acting', 'onset', 'film'], likesCount: 589000 },
    { caption: 'Hollywood is not a place. It\'s a feeling you chase your whole life. ⭐', imageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=800', hashtags: ['hollywood', 'film', 'acting'], likesCount: 712000 },
    { caption: 'That 3am call sheet is brutal. The final cut makes it all worthwhile. 😅🎬', imageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b92803e?w=800', hashtags: ['actor', 'filmlife', 'onset'], likesCount: 434000 },
  ],

  politics: [
    { caption: 'Leadership is not a title. It is a responsibility. 🌍', imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800', hashtags: ['leadership', 'politics', 'service'], likesCount: 456000 },
    { caption: 'Listening to the people. That is the job. Every single day. 🤝', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', hashtags: ['politics', 'community', 'service'], likesCount: 378000 },
    { caption: 'Change doesn\'t come overnight. But it begins with a decision to act. 💪', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', hashtags: ['change', 'leadership', 'inspire'], likesCount: 512000 },
    { caption: 'Together we can build something greater than ourselves. 🌏', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', hashtags: ['unity', 'politics', 'together'], likesCount: 689000 },
    { caption: 'The measure of a great nation is how it treats its most vulnerable. 🏛️', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', hashtags: ['politics', 'justice', 'equality'], likesCount: 823000 },
  ],

  entertainment: [
    { caption: 'Behind the scenes of something huge. Can\'t say more yet. 🤐🎬', imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800', hashtags: ['entertainment', 'comingsoon', 'behindthescenes'], likesCount: 567000 },
    { caption: 'Record-breaking opening weekend. Thank you to every single fan. 🌟', imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800', hashtags: ['entertainment', 'blockbuster', 'film'], likesCount: 1200000 },
    { caption: 'The universe is expanding. So are the stories we can tell. 🌌', imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800', hashtags: ['entertainment', 'cinema', 'stories'], likesCount: 890000 },
    { caption: 'New season. New adventures. Streaming now. 📺', imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800', hashtags: ['entertainment', 'streaming', 'newseason'], likesCount: 745000 },
    { caption: 'The magic of live performance never gets old. Tonight was special. ✨', imageUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800', hashtags: ['entertainment', 'liveshow', 'magic'], likesCount: 534000 },
  ],

  dance: [
    { caption: 'Let the music move you. Your body knows what your mind is afraid to feel. 💃', imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', hashtags: ['dance', 'movement', 'expression'], likesCount: 456000 },
    { caption: '6 hours of rehearsal today. My feet are crying but my soul is soaring. 🩰', imageUrl: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800', hashtags: ['dance', 'rehearsal', 'hardwork'], likesCount: 312000 },
    { caption: 'New choreography just dropped on my channel. Learn it with me. 🎵🕺', imageUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800', hashtags: ['dance', 'choreo', 'tutorial'], likesCount: 678000 },
    { caption: 'Dance is the only language that bridges every gap. 🌍💃', imageUrl: 'https://images.unsplash.com/photo-1545959570-a94084071b5d?w=800', hashtags: ['dance', 'culture', 'unity'], likesCount: 534000 },
    { caption: 'Performance night. This stage is my home. 🎭✨', imageUrl: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800', hashtags: ['dance', 'performance', 'stage'], likesCount: 789000 },
    { caption: 'From living room dances to world stages. Dreams do come true. 🌟', imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', hashtags: ['dance', 'dreams', 'journey'], likesCount: 912000 },
  ],

  lifestyle: [
    { caption: 'Living my best life and not taking a single day for granted. 🌸✨', imageUrl: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=800', hashtags: ['lifestyle', 'grateful', 'vibes'], likesCount: 345000 },
    { caption: 'Sunday reset. Face mask on. Phone off. Absolutely thriving. 🛁', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', hashtags: ['selfcare', 'sunday', 'reset'], likesCount: 278000 },
    { caption: 'Chasing sunsets and good energy only. 🌅', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', hashtags: ['sunset', 'vibes', 'lifestyle'], likesCount: 412000 },
    { caption: 'Brunch looks and good conversations cure everything. ☕', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', hashtags: ['brunch', 'lifestyle', 'coffee'], likesCount: 234000 },
    { caption: 'New city, new energy. The world is too big to stay in one place. 🌍', imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800', hashtags: ['travel', 'lifestyle', 'explore'], likesCount: 389000 },
    { caption: 'Plant-based. Present. Happy. 🌿', imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', hashtags: ['lifestyle', 'wellness', 'plants'], likesCount: 267000 },
    { caption: 'Outfit of the day: pure confidence. 😌', imageUrl: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=800', hashtags: ['ootd', 'lifestyle', 'confidence'], likesCount: 456000 },
  ],

  general: [
    { caption: 'Golden hour magic — there is nothing quite like it. ✨', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', hashtags: ['travel', 'goldenhour', 'landscape'], likesCount: 3420 },
    { caption: 'City lights never sleep. 🌃', imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800', hashtags: ['city', 'nightlife', 'urban'], likesCount: 2850 },
    { caption: 'Morning coffee and good vibes only. ☕', imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', hashtags: ['coffee', 'morning', 'lifestyle'], likesCount: 5100 },
    { caption: 'The ocean always has something to say. 🌊', imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800', hashtags: ['ocean', 'beach', 'travel'], likesCount: 4700 },
    { caption: 'Lost in the mountains, found myself. 🏔️', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800', hashtags: ['mountains', 'hiking', 'nature'], likesCount: 6200 },
    { caption: 'Sunsets hit different when you are truly present. 🌅', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', hashtags: ['sunset', 'beach', 'mindfulness'], likesCount: 7300 },
    { caption: 'Tokyo streets have their own energy. 🇯🇵', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', hashtags: ['tokyo', 'japan', 'travel'], likesCount: 9200 },
    { caption: 'Healthy bowl, healthy soul. 🥗', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', hashtags: ['healthyfood', 'wellness', 'nutrition'], likesCount: 2900 },
    { caption: 'Paris is always a good idea. 🗼', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', hashtags: ['paris', 'travel', 'europe'], likesCount: 15400 },
    { caption: 'Forest bathing is real therapy. 🌲', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800', hashtags: ['forest', 'nature', 'wellness'], likesCount: 5600 },
  ],
}

// ---------------------------------------------------------------------------
// Comment templates
// ---------------------------------------------------------------------------

const COMMENT_TEMPLATES = [
  'Love this so much! 😍',
  'This is everything 🙌',
  'Absolutely gorgeous!',
  'Goals! 💯',
  'Where is this?? Need to go!',
  'You always inspire me ✨',
  'This made my day 🌟',
  'Stunning as always!',
  'I needed this today 💛',
  'The vibes are immaculate 🔥',
  'Obsessed with this content!',
  'Caption is everything 😂',
  'Following for more of this!',
  'This is so good 👏',
  'Can you share more details?',
  'My favourite post this week 🔥',
  'Screenshotted this immediately 📸',
  'The realest 💯',
]

// ---------------------------------------------------------------------------
// CSV loading
// ---------------------------------------------------------------------------

function rowToAuthor(row, index) {
  const rawName = row.channel_info || row.name || row.username || `Influencer ${index + 1}`
  const base = slugify(rawName)
  const email = `${base}@example.com`
  const followerCount = parseCount(row.followers)
  const engagementRate = parseRate(row['60_day_eng_rate'])
  const usernameKey = String(rawName).trim().toLowerCase()
  const category = CATEGORY_MAP[usernameKey] || 'general'

  // Profile picture: skip celebrity dataset for USE_UNSPLASH_ONLY (e.g. nba); use default avatar
  const profilePicture = USE_UNSPLASH_ONLY.has(usernameKey) ? '' : (PROFILE_IMAGES[usernameKey] || '')

  return {
    name: String(rawName).trim().slice(0, 100) || `Influencer ${index + 1}`,
    email,
    password: 'seedpass1',
    bio: '',
    location: row.country ? String(row.country).trim().slice(0, 100) : '',
    website: '',
    isPrivate: false,
    followerCount,
    engagementRate,
    category,
    profilePicture,
  }
}

function loadFromCsv() {
  const raw = fs.readFileSync(INSTAGRAM_CSV, 'utf8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true })
  const seen = new Set()
  const authors = []
  for (let i = 0; i < rows.length; i++) {
    const row = {}
    for (const [k, v] of Object.entries(rows[i])) row[k.toLowerCase().trim()] = v
    const author = rowToAuthor(row, i)
    let email = author.email
    let n = 0
    while (seen.has(email)) { n++; email = `${slugify(author.name)}${n}@example.com` }
    seen.add(email)
    author.email = email
    authors.push(author)
  }
  return authors
}

function loadFromJson() {
  return JSON.parse(fs.readFileSync(SEED_JSON, 'utf8'))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI in .env. Cannot seed.')
    process.exit(1)
  }

  let authorDocs
  if (fs.existsSync(INSTAGRAM_CSV)) {
    console.log('Using Instagram influencers CSV (data/instagram-influencers.csv)')
    authorDocs = loadFromCsv()
  } else {
    console.log('Using seed-authors.json fallback')
    authorDocs = loadFromJson()
  }

  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected.')

    // ── Remove CSV-seeded authors not in current CSV (preserves custom signup accounts)
    const csvEmails = new Set(authorDocs.map((d) => d.email))
    const removed = await Author.deleteMany({
      $and: [
        { email: { $regex: /@example\.com$/ } },
        { email: { $nin: [...csvEmails] } },
      ],
    })
    if (removed.deletedCount > 0) {
      console.log(`Removed ${removed.deletedCount} old influencer accounts not in CSV.`)
    }

    // ── Seed Authors ──────────────────────────────────────────────────────────
    let authorsCreated = 0, authorsSkipped = 0
    for (const doc of authorDocs) {
      const exists = await Author.findOne({ email: doc.email })
      if (exists) {
        // Update category + profilePicture on existing authors
        await Author.updateOne(
          { email: doc.email },
          { $set: { category: doc.category, profilePicture: doc.profilePicture } }
        )
        authorsSkipped++
        continue
      }
      await new Author(doc).save()
      authorsCreated++
    }
    console.log(`Authors — created: ${authorsCreated}, skipped (updated category): ${authorsSkipped}`)

    // ── Seed Posts ────────────────────────────────────────────────────────────
    await Comment.deleteMany({})
    await Post.deleteMany({})
    await Author.updateMany({}, { $set: { posts: [], comments: [], savedPosts: [] } })

    const authors = await Author.find({})
    if (authors.length === 0) {
      console.log('No authors — skipping posts.')
    } else {
      const categoryStats = {}
      const postsToInsert = []
      const authorPostUpdates = [] // { authorId, postIds }

      for (const author of authors) {
        const cat = author.category || 'general'
        const templates = CATEGORY_TEMPLATES[cat] || CATEGORY_TEMPLATES.general
        const postCount = 5 + Math.floor(Math.random() * 6) // 5–10 posts
        const chosen = sample(templates, postCount)

        const usernameKey = String(author.name).trim().toLowerCase().replace(/\s+/g, '.')
        const celebImages = USE_UNSPLASH_ONLY.has(usernameKey) ? [] : (POST_IMAGES[usernameKey] || [])

        categoryStats[cat] = (categoryStats[cat] || 0) + chosen.length

        const postIds = []
        for (let t = 0; t < chosen.length; t++) {
          const template = chosen[t]
          const handle = slugify(author.name).replace(/\./g, '')
          const extraTag = Math.random() > 0.6 ? [handle] : []
          // Use celebrity image if available (skip for USE_UNSPLASH_ONLY), else Unsplash
          const imageUrl = celebImages[t] || template.imageUrl
          postsToInsert.push({
            author: author._id,
            caption: template.caption,
            imageUrl,
            likesCount: template.likesCount + Math.floor(Math.random() * 5000 - 2500),
            hashtags: [...new Set([...template.hashtags, ...extraTag])],
          })
          postIds.push(null)
        }
        authorPostUpdates.push({ authorId: author._id, postIds })
      }

      const insertedPosts = await Post.insertMany(postsToInsert)
      let idx = 0
      for (const { authorId, postIds } of authorPostUpdates) {
        for (let i = 0; i < postIds.length; i++) {
          postIds[i] = insertedPosts[idx++]._id
        }
      }

      await Promise.all(authorPostUpdates.map(({ authorId, postIds }) =>
        Author.findByIdAndUpdate(authorId, { $set: { posts: postIds } })
      ))

      console.log(`Posts — created: ${insertedPosts.length} across ${authors.length} authors`)
      console.log('Posts by category:')
      for (const [cat, count] of Object.entries(categoryStats).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${cat.padEnd(16)} ${count} posts`)
      }

      // ── Seed Comments ───────────────────────────────────────────────────────
      const commentsToInsert = []
      const postCommentUpdates = [] // { postId, commentIds }

      for (const post of insertedPosts) {
        const commentCount = 1 + Math.floor(Math.random() * 3)
        const commenters = sample(authors, commentCount)
        const commentIds = []
        for (const commenter of commenters) {
          commentsToInsert.push({
            post: post._id,
            author: commenter._id,
            content: pick(COMMENT_TEMPLATES),
            likesCount: Math.floor(Math.random() * 50),
          })
          commentIds.push(null)
        }
        postCommentUpdates.push({ postId: post._id, commentIds })
      }

      const insertedComments = await Comment.insertMany(commentsToInsert)
      idx = 0
      for (const { commentIds } of postCommentUpdates) {
        for (let i = 0; i < commentIds.length; i++) {
          commentIds[i] = insertedComments[idx++]._id
        }
      }

      await Promise.all(postCommentUpdates.map(({ postId, commentIds }) =>
        Post.findByIdAndUpdate(postId, { $set: { comments: commentIds } })
      ))

      console.log(`Comments — created: ${insertedComments.length} across ${insertedPosts.length} posts`)
    }

    console.log('Seed complete.')
  } catch (err) {
    console.error('Seed error:', err.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seed()
