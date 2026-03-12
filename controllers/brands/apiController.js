/**
 * Brand API controller – full CRUD for brand management.
 * Brands represent companies that collaborate with influencers via sponsorships.
 *
 * Endpoints:
 *   POST   /api/brands        → createBrand  (auth required)
 *   GET    /api/brands        → indexBrands  (public)
 *   GET    /api/brands/:id    → showBrand    (public)
 *   PUT    /api/brands/:id    → updateBrand  (auth required)
 *   DELETE /api/brands/:id    → deleteBrand  (auth required)
 */
const mongoose = require('mongoose')
const Brand = require('../../models/brand')

/**
 * POST /api/brands
 * Create a new brand.
 * Body: name (required), industry, website, country, description.
 * Returns 201 with { brand }; 400 on validation or duplicate name error.
 */
exports.createBrand = async (req, res) => {
  try {
    const brand = new Brand({
      name: req.body.name,
      industry: req.body.industry || 'general',
      website: req.body.website || '',
      country: req.body.country || '',
      description: req.body.description || '',
    })
    await brand.save()
    res.status(201).json({ brand })
  } catch (error) {
    // Catches validation errors and E11000 duplicate key (unique name)
    res.status(400).json({ message: error.message })
  }
}

/**
 * GET /api/brands?page=1&limit=10
 * List brands alphabetically. Supports pagination via query params.
 * Public – no auth required.
 * Returns 200 with { brands, total, page, pages }.
 */
exports.indexBrands = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const [brands, total] = await Promise.all([
      Brand.find({}).sort({ name: 1 }).skip(skip).limit(limit),
      Brand.countDocuments(),
    ])

    res.status(200).json({ brands, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/brands/:id
 * Get a single brand by its MongoDB _id.
 * Public – no auth required.
 * Returns 200 with { brand }; 400 for invalid id; 404 if not found.
 */
exports.showBrand = async (req, res) => {
  try {
    // Reject malformed ids before hitting the DB
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid brand id' })
    }
    const brand = await Brand.findById(req.params.id)
    if (!brand) return res.status(404).json({ message: 'Brand not found' })
    res.status(200).json({ brand })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * PUT /api/brands/:id
 * Update a brand by id.
 * Auth required – any logged-in user can update a brand (admin-style operation).
 * Returns 200 with { brand }; 400 for bad id/validation; 404 if not found.
 */
exports.updateBrand = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid brand id' })
    }
    // Whitelist allowed fields
    const allowed = ['name', 'industry', 'website', 'country', 'description']
    const updates = {}
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    })
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    if (!brand) return res.status(404).json({ message: 'Brand not found' })
    res.status(200).json({ brand })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * DELETE /api/brands/:id
 * Delete a brand by id.
 * Auth required.
 * Returns 204 no content; 400 for bad id; 404 if not found.
 */
exports.deleteBrand = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid brand id' })
    }
    const brand = await Brand.findByIdAndDelete(req.params.id)
    if (!brand) return res.status(404).json({ message: 'Brand not found' })
    // 204 No Content – REST convention for successful delete
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
