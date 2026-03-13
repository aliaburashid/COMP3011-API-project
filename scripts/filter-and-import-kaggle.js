/**
 * Filter influencers to only those with matching images in Kaggle Celebrity Database (332 names),
 * then import their profile images.
 *
 * 1. Download dataset: https://www.kaggle.com/datasets/mhmaslam/celebrity-database-332-names
 * 2. Extract to: data/celebrity-database-332-names/
 * 3. Run: node scripts/filter-and-import-kaggle.js
 */
const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

const DATA_DIR = path.join(__dirname, '..', 'data')
const KAGGLE_DIR = path.join(DATA_DIR, 'dataset')
const PROFILES_DIR = path.join(__dirname, '..', 'public', 'images', 'profiles')
const POSTS_DIR = path.join(__dirname, '..', 'public', 'images', 'posts')
const CSV_PATH = path.join(DATA_DIR, 'instagram-influencers.csv')

// Exclude augmented variants (_temp, _bright, _flipped, etc.) — use only base images
function isBaseImage(f) {
  return /\.(jpg|jpeg|png|webp)$/i.test(f) && !/_temp|_bright|_dark|_flipped|_rotated/i.test(f)
}

function normalize(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function toFilename(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'user'
}

function findFolderForUsername(username) {
  if (!fs.existsSync(KAGGLE_DIR)) return null
  const normTarget = normalize(username)
  let baseDir = KAGGLE_DIR
  const topLevel = fs.readdirSync(KAGGLE_DIR, { withFileTypes: true })
  if (topLevel.length === 1 && topLevel[0].isDirectory()) {
    baseDir = path.join(KAGGLE_DIR, topLevel[0].name)
  }
  const entries = fs.readdirSync(baseDir, { withFileTypes: true })

  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    const folderNorm = normalize(ent.name)
    if (folderNorm.includes(normTarget) || normTarget.includes(folderNorm)) {
      const folderPath = path.join(baseDir, ent.name)
      const files = fs.readdirSync(folderPath).filter(isBaseImage)
      if (files.length > 0) return { folderPath, files }
    }
  }

  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    const folderPath = path.join(baseDir, ent.name)
    const files = fs.readdirSync(folderPath).filter(isBaseImage)
    if (files.length > 0) {
      const folderNorm = normalize(ent.name)
      if (folderNorm === normTarget || folderNorm.startsWith(normTarget.slice(0, 8))) {
        return { folderPath, files }
      }
    }
  }

  const normTargetNoNumbers = normTarget.replace(/\d+/g, '')
  for (const ent of entries) {
    if (!ent.isDirectory()) continue
    const words = ent.name.split(/[\s_]+/).map(w => normalize(w)).filter(w => w.length >= 5)
    for (const word of words) {
      if (normTargetNoNumbers.includes(word) || normTarget.includes(word)) {
        const folderPath = path.join(baseDir, ent.name)
        const files = fs.readdirSync(folderPath).filter(isBaseImage)
        if (files.length > 0) return { folderPath, files }
      }
    }
  }
  return null
}

function main() {
  if (!fs.existsSync(KAGGLE_DIR)) {
    console.error('Dataset not found. Please:')
    console.error('1. Download from https://www.kaggle.com/datasets/mhmaslam/celebrity-database-332-names')
    console.error('2. Extract to: data/dataset/')
    process.exit(1)
  }

  if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true })
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true })

  const raw = fs.readFileSync(CSV_PATH, 'utf8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true })

  // Filter to only rows with a matching Kaggle image
  const kept = []
  const removed = []

  for (let i = 0; i < rows.length; i++) {
    const username = (rows[i].channel_info || '').trim()
    if (!username) continue

    const match = findFolderForUsername(username)
    if (match) {
      kept.push(rows[i])
    } else {
      removed.push(username)
    }
  }

  // Write filtered CSV
  const header = Object.keys(rows[0] || {})
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [header.join(',')].concat(kept.map(r => header.map(h => escape(r[h])).join(',')))
  fs.writeFileSync(CSV_PATH, lines.join('\n'))
  console.log(`Filtered CSV: kept ${kept.length}, removed ${removed.length}`)
  if (removed.length > 0) {
    console.log('Removed (no Kaggle match):', removed.join(', '))
  }

  // Import: 1st image → profile, rest → posts
  const profileImages = {}
  const postImages = {}
  let ok = 0, fail = 0

  for (let i = 0; i < kept.length; i++) {
    const username = (kept[i].channel_info || '').trim()
    const key = username.toLowerCase()
    const safeName = toFilename(username)

    process.stdout.write(`[${i + 1}/${kept.length}] ${username}... `)

    const match = findFolderForUsername(username)
    if (!match) {
      console.log('no match')
      fail++
      continue
    }

    const { folderPath, files } = match
    const ext = path.extname(files[0])

    try {
      // 1st image → profile
      const profileSrc = path.join(folderPath, files[0])
      const profileOut = path.join(PROFILES_DIR, `${safeName}${ext}`)
      fs.copyFileSync(profileSrc, profileOut)
      profileImages[key] = `/images/profiles/${safeName}${ext}`

      // Rest → posts (in /images/posts/{username}/)
      const postUrls = []
      if (files.length > 1) {
        const userPostsDir = path.join(POSTS_DIR, safeName)
        if (!fs.existsSync(userPostsDir)) fs.mkdirSync(userPostsDir, { recursive: true })
        for (let j = 1; j < files.length; j++) {
          const src = path.join(folderPath, files[j])
          const out = path.join(userPostsDir, `${j}${path.extname(files[j])}`)
          fs.copyFileSync(src, out)
          postUrls.push(`/images/posts/${safeName}/${j}${path.extname(files[j])}`)
        }
      }
      postImages[key] = postUrls

      console.log(`OK (profile + ${postUrls.length} posts)`)
      ok++
    } catch (err) {
      console.log('err:', err.message)
      fail++
    }
  }

  const profileContent = `/**
 * Profile images from Kaggle Celebrity Database (332 names).
 * License: DbCL v1.0 (Open Data Commons)
 * https://www.kaggle.com/datasets/mhmaslam/celebrity-database-332-names
 */
module.exports = ${JSON.stringify(profileImages, null, 2)}
`
  fs.writeFileSync(path.join(DATA_DIR, 'profile-images.js'), profileContent)

  const postContent = `/**
 * Post images from Kaggle Celebrity Database (rest of images per celebrity).
 * Key: lowercase username. Value: array of image paths for posts.
 */
module.exports = ${JSON.stringify(postImages, null, 2)}
`
  fs.writeFileSync(path.join(DATA_DIR, 'post-images.js'), postContent)

  console.log(`\nDone. ${ok} imported (profile + posts). Updated profile-images.js and post-images.js`)
}

main()
