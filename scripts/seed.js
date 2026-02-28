/**
 * Seed script: load authors into MongoDB from either:
 * 1. Instagram influencers CSV (data/instagram-influencers.csv) – from Kaggle
 * 2. Fallback: seed-authors.json
 *
 * Run: npm run seed. Requires MONGO_URI in .env.
 * Duplicate emails are skipped. Safe to run multiple times.
 */
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const { parse } = require('csv-parse/sync')
const db = require('../models/db')
const Author = require('../models/author')

const DATA_DIR = path.join(__dirname, '..', 'data')
const INSTAGRAM_CSV = path.join(DATA_DIR, 'instagram-influencers.csv')
const SEED_JSON = path.join(DATA_DIR, 'seed-authors.json')

/** Turn a string into a safe email local part (no spaces/special chars) */
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    .slice(0, 50) || 'user'
}

/**
 * Map a row from Instagram influencers CSV to our Author schema.
 * Supports common column names: Name, Username, Instagram, Category, Followers, Country, etc.
 */
function rowToAuthor(row, index) {
  // channel_info is the username column in the Kaggle Instagram influencers CSV
  const rawName = row.channel_info || row.name || row.username || row.instagram || row.influencer || row.account || `Influencer ${index + 1}`
  const rawUsername = row.channel_info || row.username || row.instagram || row.name || row.account || slugify(rawName)
  const base = slugify(rawUsername)
  const email = `${base}@example.com`
  const parts = []
  if (row.followers) parts.push(`${row.followers} followers`)
  if (row.influence_score) parts.push(`influence score: ${row.influence_score}`)
  if (row.country) parts.push(String(row.country))
  const bio = parts.length ? parts.join(' • ') : 'Instagram influencer / content creator.'

  return {
    name: String(rawName).trim().slice(0, 100) || `Influencer ${index + 1}`,
    email: email,
    password: 'seedpass1',
    bio: bio.slice(0, 500),
    location: row.country ? String(row.country).trim().slice(0, 100) : '',
    website: null,
    isPrivate: false,
  }
}

/** Load authors from Instagram CSV; normalize header keys to lowercase for flexible column names */
function loadFromCsv() {
  const raw = fs.readFileSync(INSTAGRAM_CSV, 'utf8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true })
  const seen = new Set()
  const authors = []
  for (let i = 0; i < rows.length; i++) {
    const row = {}
    for (const [k, v] of Object.entries(rows[i])) {
      row[k.toLowerCase().trim()] = v
    }
    const author = rowToAuthor(row, i)
    let email = author.email
    let n = 0
    while (seen.has(email)) {
      n++
      email = `${slugify(author.name)}${n}@example.com`
    }
    seen.add(email)
    author.email = email
    authors.push(author)
  }
  return authors
}

/** Load authors from built-in JSON */
function loadFromJson() {
  const raw = fs.readFileSync(SEED_JSON, 'utf8')
  return JSON.parse(raw)
}

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI in .env. Cannot seed.')
    process.exit(1)
  }

  let authors
  if (fs.existsSync(INSTAGRAM_CSV)) {
    console.log('Using Instagram influencers CSV (data/instagram-influencers.csv)')
    authors = loadFromCsv()
  } else {
    console.log('Using seed-authors.json (place instagram-influencers.csv in data/ for Kaggle dataset)')
    authors = loadFromJson()
  }

  db.once('open', async () => {
    try {
      let created = 0
      let skipped = 0
      for (const doc of authors) {
        const exists = await Author.findOne({ email: doc.email })
        if (exists) {
          skipped++
          continue
        }
        const author = new Author(doc)
        await author.save()
        created++
      }
      console.log(`Seed done. Created: ${created}, Skipped (already exist): ${skipped}`)
    } catch (err) {
      console.error('Seed error:', err.message)
      process.exit(1)
    } finally {
      await db.close()
      process.exit(0)
    }
  })

  db.on('error', (err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
}

seed()
