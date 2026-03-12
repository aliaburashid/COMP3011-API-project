/**
 * Sponsorship model – the link between an influencer (Author) and a Brand.
 * Represents a marketing campaign deal: who, with whom, for what, and when.
 * Optionally references the Post created as part of the campaign.
 */
const mongoose = require('mongoose')

const sponsorshipSchema = new mongoose.Schema(
  {
    // The influencer involved in the deal (required)
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
    // The brand paying for the campaign (required)
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    // Optional: the specific post created as part of this sponsorship
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },

    // Name of the marketing campaign (e.g. "Summer Collection 2025")
    campaignName: { type: String, required: true, trim: true },
    // Platform where the content will be published
    platform: {
      type: String,
      enum: ['instagram', 'tiktok', 'youtube', 'snapchat'],
      default: 'instagram',
    },
    // Agreed deal value in USD (0 = not disclosed or gifted deal)
    dealValue: { type: Number, default: 0, min: 0 },
    // Current status of the campaign
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'cancelled'],
      default: 'planned',
    },
    // Optional internal notes about the deal
    notes: { type: String, trim: true, default: '' },
    // Campaign start and end dates (optional)
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
)

// Index for fast queries: find all sponsorships for an author or brand
sponsorshipSchema.index({ author: 1 })
sponsorshipSchema.index({ brand: 1 })

const Sponsorship = mongoose.model('Sponsorship', sponsorshipSchema)
module.exports = Sponsorship
