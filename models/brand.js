/**
 * Brand model – companies that collaborate with influencers.
 * Used in Sponsorship documents as the brand side of a deal.
 */
const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema(
  {
    // Brand name is required and must be unique (e.g. "Nike", "L'Oréal")
    name: { type: String, required: true, unique: true, trim: true },
    // Industry category (e.g. sportswear, beauty, tech)
    industry: { type: String, trim: true, default: 'general' },
    // Brand's official website URL
    website: { type: String, trim: true, default: '' },
    // Country where the brand is headquartered
    country: { type: String, trim: true, default: '' },
    // Short description of the brand and what they do
    description: { type: String, trim: true, default: '' },
  },
  // Automatically adds createdAt and updatedAt fields
  { timestamps: true }
)

const Brand = mongoose.model('Brand', brandSchema)
module.exports = Brand
