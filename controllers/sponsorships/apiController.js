/**
 * Sponsorship API controller – full CRUD for influencer-brand deals.
 * A Sponsorship links an Author (influencer) to a Brand with campaign details.
 *
 * Endpoints:
 *   POST   /api/sponsorships        → createSponsorship  (auth required)
 *   GET    /api/sponsorships        → indexSponsorships  (public)
 *   GET    /api/sponsorships/:id    → showSponsorship    (public)
 *   PUT    /api/sponsorships/:id    → updateSponsorship  (auth required)
 *   DELETE /api/sponsorships/:id    → deleteSponsorship  (auth required)
 */
const mongoose = require('mongoose')
const Sponsorship = require('../../models/sponsorship')

/** Shared populate config – used on all read operations for consistent responses */
const POPULATE = [
  { path: 'author', select: 'name followerCount category profilePicture' },
  { path: 'brand', select: 'name industry country' },
  { path: 'post', select: 'caption likesCount imageUrl' },
]

/**
 * POST /api/sponsorships
 * Create a new sponsorship deal.
 * Body: author, brand, campaignName (required); post, platform, dealValue, status, notes, startDate, endDate (optional).
 * Returns 201 with { sponsorship }; 400 on validation error.
 */
exports.createSponsorship = async (req, res) => {
  try {
    // Validate required ObjectId fields before creating the document
    if (req.body.author && !mongoose.Types.ObjectId.isValid(req.body.author)) {
      return res.status(400).json({ message: 'Invalid author id' })
    }
    if (req.body.brand && !mongoose.Types.ObjectId.isValid(req.body.brand)) {
      return res.status(400).json({ message: 'Invalid brand id' })
    }
    if (req.body.post && !mongoose.Types.ObjectId.isValid(req.body.post)) {
      return res.status(400).json({ message: 'Invalid post id' })
    }

    const sponsorship = new Sponsorship({
      // Default author to the logged-in user if not explicitly provided
      author: req.body.author || req.user._id,
      brand: req.body.brand,
      post: req.body.post || null,
      campaignName: req.body.campaignName,
      platform: req.body.platform || 'instagram',
      dealValue: req.body.dealValue || 0,
      status: req.body.status || 'planned',
      notes: req.body.notes || '',
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
    })

    await sponsorship.save()

    // Populate related documents before returning so the response is readable
    await sponsorship.populate(POPULATE)

    res.status(201).json({ sponsorship })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * GET /api/sponsorships
 * List all sponsorships, newest first. Populates author, brand, and post.
 * Public – no auth required.
 * Returns 200 with { sponsorships: [...] }.
 */
exports.indexSponsorships = async (req, res) => {
  try {
    const sponsorships = await Sponsorship.find({})
      .sort({ createdAt: -1 })
      .populate(POPULATE)

    res.status(200).json({ sponsorships })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/sponsorships/:id
 * Get a single sponsorship by its MongoDB _id.
 * Public – no auth required.
 * Returns 200 with { sponsorship }; 400 for invalid id; 404 if not found.
 */
exports.showSponsorship = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sponsorship id' })
    }
    const sponsorship = await Sponsorship.findById(req.params.id).populate(POPULATE)
    if (!sponsorship) return res.status(404).json({ message: 'Sponsorship not found' })
    res.status(200).json({ sponsorship })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * PUT /api/sponsorships/:id
 * Update a sponsorship by id.
 * Auth required.
 * Returns 200 with { sponsorship }; 400 for bad id/validation; 404 if not found.
 */
exports.updateSponsorship = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sponsorship id' })
    }

    // Whitelist of fields that can be updated
    const allowed = ['campaignName', 'platform', 'dealValue', 'status', 'notes', 'startDate', 'endDate', 'post']
    const updates = {}
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    })

    const sponsorship = await Sponsorship.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate(POPULATE)

    if (!sponsorship) return res.status(404).json({ message: 'Sponsorship not found' })
    res.status(200).json({ sponsorship })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * DELETE /api/sponsorships/:id
 * Delete a sponsorship by id.
 * Auth required.
 * Returns 204 no content; 400 for bad id; 404 if not found.
 */
exports.deleteSponsorship = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid sponsorship id' })
    }
    const sponsorship = await Sponsorship.findByIdAndDelete(req.params.id)
    if (!sponsorship) return res.status(404).json({ message: 'Sponsorship not found' })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
