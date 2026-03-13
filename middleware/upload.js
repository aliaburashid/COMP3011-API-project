const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')

const UPLOAD_DIR = process.env.UPLOAD_PATH || 'public/uploads'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    // Always store originals with their real extension
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
})

const processImage = async (req, res, next) => {
  if (!req.file) return next()

  const originalPath = path.join(UPLOAD_DIR, req.file.filename)
  // Always output .jpg so browsers can display it regardless of input format
  const outputFilename = 'processed-' + path.parse(req.file.filename).name + '.jpg'
  const outputPath = path.join(UPLOAD_DIR, outputFilename)

  try {
    await sharp(originalPath)
      .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(outputPath)

    // Remove the original to save space
    fs.unlink(originalPath, () => {})

    req.file.filename = outputFilename
    req.file.path = '/uploads/' + outputFilename
    next()
  } catch (err) {
    // sharp failed (e.g. unsupported format) — serve the original file as-is
    req.file.path = '/uploads/' + req.file.filename
    next()
  }
}

module.exports = { upload, processImage }
