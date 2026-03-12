/**
 * Seed script: populates MongoDB with Authors, Posts, Brands, and Sponsorships.
 *
 * Authors: loaded from data/instagram-influencers.csv (Kaggle dataset) or
 *          data/seed-authors.json as fallback.
 *
 * Posts: generated from a curated subset of the Unsplash 25K dataset
 *        (https://www.kaggle.com/datasets/ntsv648/unsplash-25k).
 *        Only image URLs and tags are used; images are not stored in the DB.
 *
 * Brands: 20 well-known global companies (sourced from Forbes Global 2000).
 *
 * Sponsorships: generated programmatically by linking seeded authors to brands,
 *               simulating real influencer marketing campaign data.
 *
 * Run: npm run seed
 * Safe to run multiple times — skips existing authors, clears+recreates posts/brands/sponsorships.
 */
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const { parse } = require('csv-parse/sync')
const mongoose = require('mongoose')
const Author = require('../models/author')
const Post = require('../models/post')
const Brand = require('../models/brand')
const Sponsorship = require('../models/sponsorship')

const DATA_DIR = path.join(__dirname, '..', 'data')
const INSTAGRAM_CSV = path.join(DATA_DIR, 'instagram-influencers.csv')
const SEED_JSON = path.join(DATA_DIR, 'seed-authors.json')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Turn a string into a safe email local part (no spaces/special chars) */
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
    .slice(0, 50) || 'user'
}

/** Return a random element from an array */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ---------------------------------------------------------------------------
// Author seeding helpers
// ---------------------------------------------------------------------------

/**
 * Parse a follower/likes string from the CSV (e.g. "12.5M", "830.2K") into a Number.
 * Returns 0 if the value cannot be parsed.
 */
function parseCount(str) {
  if (!str) return 0
  const s = String(str).trim().toUpperCase()
  if (s.endsWith('M')) return Math.round(parseFloat(s) * 1_000_000)
  if (s.endsWith('K')) return Math.round(parseFloat(s) * 1_000)
  return Math.round(parseFloat(s)) || 0
}

/**
 * Parse an engagement rate string (e.g. "3.25%", "1.5") into a Number.
 * Returns 0 if the value cannot be parsed.
 */
function parseRate(str) {
  if (!str) return 0
  return parseFloat(String(str).replace('%', '').trim()) || 0
}

/**
 * Map a row from the Instagram influencers CSV to our Author schema.
 * channel_info = username column in the Kaggle dataset.
 * Includes followerCount, engagementRate for analytics endpoints.
 */
function rowToAuthor(row, index) {
  const rawName = row.channel_info || row.name || row.username || `Influencer ${index + 1}`
  const rawUsername = row.channel_info || row.username || row.name || slugify(rawName)
  const base = slugify(rawUsername)
  const email = `${base}@example.com`

  // followerCount stored as Number for sorting/analytics (top-authors endpoint)
  const followerCount = parseCount(row.followers)
  // 60-day engagement rate stored as Number for engagement analytics
  const engagementRate = parseRate(row['60_day_eng_rate'])
  // influence_score used in bio for context
  const influenceScore = row.influence_score ? `influence score: ${row.influence_score}` : ''
  const bio = [
    followerCount ? `${row.followers} followers` : '',
    influenceScore,
    row.country ? String(row.country) : '',
  ].filter(Boolean).join(' • ') || 'Instagram influencer / content creator.'

  return {
    name: String(rawName).trim().slice(0, 100) || `Influencer ${index + 1}`,
    email,
    password: 'seedpass1',
    bio: bio.slice(0, 500),
    location: row.country ? String(row.country).trim().slice(0, 100) : '',
    website: '',
    isPrivate: false,
    followerCount,
    engagementRate,
    category: 'general', // CSV has no category column; default for now
  }
}

/** Load authors from the Kaggle Instagram influencers CSV */
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

/** Load authors from the built-in JSON fallback */
function loadFromJson() {
  const raw = fs.readFileSync(SEED_JSON, 'utf8')
  return JSON.parse(raw)
}

// ---------------------------------------------------------------------------
// Post seed data
// A curated subset of the Unsplash 25K dataset (Kaggle: ntsv648/unsplash-25k).
// Only image URLs and tags are used; no images are stored in the database.
// ---------------------------------------------------------------------------

const POST_TEMPLATES = [
  {
    caption: 'Golden hour magic — there is nothing quite like it. ✨',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    hashtags: ['travel', 'goldenhour', 'landscape'],
    likesCount: 3420,
  },
  {
    caption: 'City lights never sleep. 🌃',
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
    hashtags: ['city', 'nightlife', 'urban'],
    likesCount: 2850,
  },
  {
    caption: 'Morning coffee and good vibes only. ☕',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    hashtags: ['coffee', 'morning', 'lifestyle'],
    likesCount: 5100,
  },
  {
    caption: 'The ocean always has something to say. 🌊',
    imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800',
    hashtags: ['ocean', 'beach', 'travel'],
    likesCount: 4700,
  },
  {
    caption: 'Lost in the mountains, found myself. 🏔️',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    hashtags: ['mountains', 'hiking', 'nature'],
    likesCount: 6200,
  },
  {
    caption: 'Street food adventures in the best city. 🍜',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    hashtags: ['food', 'streetfood', 'travel'],
    likesCount: 3900,
  },
  {
    caption: 'New collab dropping soon — stay tuned. 👀 #ad',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    hashtags: ['fashion', 'style', 'collab'],
    likesCount: 8800,
  },
  {
    caption: 'Sunsets hit different when you are truly present. 🌅',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    hashtags: ['sunset', 'beach', 'mindfulness'],
    likesCount: 7300,
  },
  {
    caption: 'Gym progress update — consistency is everything. 💪',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    hashtags: ['fitness', 'gym', 'wellness'],
    likesCount: 4100,
  },
  {
    caption: 'Forest bathing is real therapy. 🌲',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
    hashtags: ['forest', 'nature', 'wellness'],
    likesCount: 5600,
  },
  {
    caption: 'Tokyo streets have their own energy. 🇯🇵',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    hashtags: ['tokyo', 'japan', 'travel'],
    likesCount: 9200,
  },
  {
    caption: 'Plant mom era. 🌿',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
    hashtags: ['plants', 'homedecor', 'lifestyle'],
    likesCount: 3300,
  },
  {
    caption: 'Healthy bowl, healthy soul. 🥗',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    hashtags: ['healthyfood', 'wellness', 'nutrition'],
    likesCount: 2900,
  },
  {
    caption: 'Desert roads and no destination. 🛣️',
    imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800',
    hashtags: ['desert', 'roadtrip', 'travel'],
    likesCount: 4400,
  },
  {
    caption: 'Architecture that takes your breath away. 🏛️',
    imageUrl: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800',
    hashtags: ['architecture', 'design', 'art'],
    likesCount: 3700,
  },
  {
    caption: 'Woke up like this — literally. 😌',
    imageUrl: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=800',
    hashtags: ['selfcare', 'morning', 'lifestyle'],
    likesCount: 6800,
  },
  {
    caption: 'Collaboration with @brandname — link in bio! 🔗 #sponsored',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    hashtags: ['sponsored', 'fashion', 'ad'],
    likesCount: 11200,
  },
  {
    caption: 'Nothing beats a good book and a rainy day. 📖',
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    hashtags: ['books', 'reading', 'cozy'],
    likesCount: 2200,
  },
  {
    caption: 'Paris is always a good idea. 🗼',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    hashtags: ['paris', 'travel', 'europe'],
    likesCount: 15400,
  },
  {
    caption: 'Trying new things is how you grow. 🌱',
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800',
    hashtags: ['motivation', 'growth', 'mindset'],
    likesCount: 4900,
  },
]

// ---------------------------------------------------------------------------
// Brand seed data – sourced from Forbes Global 2000 (well-known global companies)
// ---------------------------------------------------------------------------

const BRAND_TEMPLATES = [
  { name: 'Nike', industry: 'sportswear', country: 'United States', website: 'https://nike.com', description: 'Global sportswear, footwear and equipment brand.' },
  { name: "L'Oréal", industry: 'beauty', country: 'France', website: 'https://loreal.com', description: 'World leading beauty and cosmetics company.' },
  { name: 'Adidas', industry: 'sportswear', country: 'Germany', website: 'https://adidas.com', description: 'Multinational sportswear and footwear brand.' },
  { name: 'Apple', industry: 'technology', country: 'United States', website: 'https://apple.com', description: 'Consumer electronics, software and services.' },
  { name: 'Samsung', industry: 'technology', country: 'South Korea', website: 'https://samsung.com', description: 'Electronics, appliances and mobile devices.' },
  { name: 'Coca-Cola', industry: 'food & beverage', country: 'United States', website: 'https://coca-cola.com', description: 'Global beverage manufacturer and distributor.' },
  { name: 'Gucci', industry: 'luxury fashion', country: 'Italy', website: 'https://gucci.com', description: 'Italian luxury fashion and leather goods house.' },
  { name: 'Dior', industry: 'luxury fashion', country: 'France', website: 'https://dior.com', description: 'French luxury fashion and cosmetics house.' },
  { name: 'Gymshark', industry: 'fitness apparel', country: 'United Kingdom', website: 'https://gymshark.com', description: 'Fitness apparel and accessories brand.' },
  { name: 'Spotify', industry: 'technology', country: 'Sweden', website: 'https://spotify.com', description: 'Digital music, podcast and video streaming service.' },
  { name: 'Amazon', industry: 'e-commerce', country: 'United States', website: 'https://amazon.com', description: 'Global e-commerce and cloud computing company.' },
  { name: 'H&M', industry: 'fashion', country: 'Sweden', website: 'https://hm.com', description: 'Global fashion retail chain.' },
  { name: 'Zara', industry: 'fashion', country: 'Spain', website: 'https://zara.com', description: 'Fast fashion retail brand owned by Inditex.' },
  { name: 'Red Bull', industry: 'food & beverage', country: 'Austria', website: 'https://redbull.com', description: 'Energy drink brand and extreme sports sponsor.' },
  { name: 'Sephora', industry: 'beauty', country: 'France', website: 'https://sephora.com', description: 'International chain of personal care and beauty stores.' },
  { name: 'Puma', industry: 'sportswear', country: 'Germany', website: 'https://puma.com', description: 'Multinational sportswear and footwear manufacturer.' },
  { name: 'Rolex', industry: 'luxury goods', country: 'Switzerland', website: 'https://rolex.com', description: 'Swiss luxury watch manufacturer.' },
  { name: 'Beats by Dre', industry: 'technology', country: 'United States', website: 'https://beatsbydre.com', description: 'Premium audio equipment brand owned by Apple.' },
  { name: 'Revolve', industry: 'fashion', country: 'United States', website: 'https://revolve.com', description: 'Online fashion retailer popular with influencers.' },
  { name: 'Daniel Wellington', industry: 'fashion accessories', country: 'Sweden', website: 'https://danielwellington.com', description: 'Watch and accessories brand known for influencer marketing.' },
]

const CAMPAIGN_NAMES = [
  'Summer Collection Launch', 'New Year Campaign', 'Brand Ambassador Program',
  'Holiday Gift Guide', 'Product Launch 2025', 'Sustainability Initiative',
  'Back to School', 'Fitness Challenge', 'Beauty Tutorial Series',
  'Limited Edition Drop', 'Global Awareness Campaign', 'Lifestyle Partnership',
]

const PLATFORMS = ['instagram', 'instagram', 'tiktok', 'youtube', 'snapchat']
const STATUSES = ['planned', 'active', 'active', 'completed', 'completed', 'cancelled']

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI in .env. Cannot seed.')
    process.exit(1)
  }

  // Load author data from CSV or JSON fallback
  let authorDocs
  if (fs.existsSync(INSTAGRAM_CSV)) {
    console.log('Using Instagram influencers CSV (data/instagram-influencers.csv)')
    authorDocs = loadFromCsv()
  } else {
    console.log('Using seed-authors.json (place instagram-influencers.csv in data/ for Kaggle dataset)')
    authorDocs = loadFromJson()
  }

  try {
    // Connect directly using await — avoids the db.once('open') timing race
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected.')

    // --- Seed authors ---
    let authorsCreated = 0
    let authorsSkipped = 0
    for (const doc of authorDocs) {
      const exists = await Author.findOne({ email: doc.email })
      if (exists) { authorsSkipped++; continue }
      await new Author(doc).save()
      authorsCreated++
    }
    console.log(`Authors — created: ${authorsCreated}, skipped (already exist): ${authorsSkipped}`)

    // --- Seed posts ---
    // Clear existing posts first so we don't accumulate duplicates on re-runs
    await Post.deleteMany({})
    await Author.updateMany({}, { $set: { posts: [] } })

    // Get all authors from DB to assign posts to
    const authors = await Author.find({})
    if (authors.length === 0) {
      console.log('No authors found — skipping post seeding.')
    } else {
      let postsCreated = 0
      // Assign 2–4 posts per author, shuffling templates so each author gets varied content
      for (const author of authors) {
        const count = 2 + Math.floor(Math.random() * 3) // 2, 3, or 4 posts per author

        // Shuffle a copy of the templates so no two consecutive posts share the same content
        const shuffled = [...POST_TEMPLATES].sort(() => 0.5 - Math.random())
        const selected = shuffled.slice(0, count)

        for (const template of selected) {
          // Personalise caption 50% of the time by appending the author's handle as a hashtag
          const handle = slugify(author.name).replace(/\./g, '')
          const caption = Math.random() > 0.5
            ? template.caption
            : `${template.caption} #${handle}`

          const post = new Post({
            author: author._id,
            caption,
            imageUrl: template.imageUrl,
            // Add slight random variation to likesCount so posts feel different
            likesCount: template.likesCount + Math.floor(Math.random() * 500),
            // Deduplicate hashtags using Set
            hashtags: [...new Set(template.hashtags)],
          })
          await post.save()
          // Keep Author.posts array in sync with created post
          await Author.findByIdAndUpdate(author._id, { $push: { posts: post._id } })
          postsCreated++
        }
      }
      console.log(`Posts — created: ${postsCreated} across ${authors.length} authors`)
    }

    // --- Seed brands ---
    // Clear existing brands and sponsorships first to avoid duplicates on re-runs
    await Sponsorship.deleteMany({})
    await Brand.deleteMany({})

    const createdBrands = []
    for (const doc of BRAND_TEMPLATES) {
      const brand = await new Brand(doc).save()
      createdBrands.push(brand)
    }
    console.log(`Brands — created: ${createdBrands.length}`)

    // --- Seed sponsorships ---
    // Assign 1–3 sponsorship deals to a random selection of authors
    const allAuthors = await Author.find({})
    // Use the top 40 authors (by followerCount) as the sponsored ones
    const topAuthors = allAuthors.sort((a, b) => b.followerCount - a.followerCount).slice(0, 40)

    let sponsorshipsCreated = 0
    for (const author of topAuthors) {
      // Each top author gets 1–3 sponsorship deals
      const dealCount = 1 + Math.floor(Math.random() * 3)
      // Shuffle brands so each author gets different brand deals
      const shuffledBrands = [...createdBrands].sort(() => 0.5 - Math.random()).slice(0, dealCount)

      for (const brand of shuffledBrands) {
        const sponsorship = new Sponsorship({
          author: author._id,
          brand: brand._id,
          campaignName: pick(CAMPAIGN_NAMES),
          platform: pick(PLATFORMS),
          // Deal value varies by follower count — bigger influencers earn more
          dealValue: Math.round((author.followerCount / 1_000_000) * (5000 + Math.random() * 10000)),
          status: pick(STATUSES),
          notes: '',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        })
        await sponsorship.save()
        sponsorshipsCreated++
      }
    }
    console.log(`Sponsorships — created: ${sponsorshipsCreated} across ${topAuthors.length} authors`)

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
