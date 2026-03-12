/**
 * Analytics controller – marketing intelligence endpoints.
 * Provides data insights across Authors and Posts using Mongoose queries
 * and MongoDB aggregation pipelines.
 *
 * All endpoints are public (no auth required).
 *
 * Endpoints:
 *   GET /api/analytics/top-influencers           -> topInfluencers
 *   GET /api/analytics/most-liked-posts          -> mostLikedPosts
 *   GET /api/analytics/most-active-authors       -> mostActiveAuthors
 *   GET /api/analytics/category-stats            -> categoryStats
 *   GET /api/analytics/top-brands                -> topBrands
 *   GET /api/analytics/top-sponsored-influencers -> topSponsoredInfluencers
 *   GET /api/analytics/high-value-campaigns      -> highValueCampaigns
 */
const Author = require('../../models/author')
const Post = require('../../models/post')
const Sponsorship = require('../../models/sponsorship')

/**
 * GET /api/analytics/top-influencers
 * Returns the top 10 influencers sorted by followerCount descending.
 * Useful for identifying the highest-reach creators in the platform.
 * Returns 200 with { authors: [...] }.
 */
exports.topInfluencers = async (req, res) => {
  try {
    // Sort by followerCount descending; limit to top 10; only return relevant fields
    const authors = await Author.find({})
      .sort({ followerCount: -1 })
      .limit(10)
      .select('name followerCount engagementRate category location')

    res.status(200).json({ authors })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/analytics/most-liked-posts
 * Returns the top 10 posts sorted by likesCount descending.
 * Populates the author field with name and profilePicture for display.
 * Returns 200 with { posts: [...] }.
 */
exports.mostLikedPosts = async (req, res) => {
  try {
    // Sort by likesCount descending; populate author name + avatar; limit to 10
    const posts = await Post.find({})
      .sort({ likesCount: -1 })
      .limit(10)
      .populate('author', 'name profilePicture')

    res.status(200).json({ posts })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/analytics/most-active-authors
 * Returns the top 10 authors sorted by number of posts they have created.
 * Uses MongoDB aggregation to compute postCount from the posts array length.
 * Returns 200 with { authors: [...] } including a postCount field.
 */
exports.mostActiveAuthors = async (req, res) => {
  try {
    const authors = await Author.aggregate([
      // Compute postCount as the length of the posts array for each author
      {
        $addFields: {
          postCount: { $size: '$posts' },
        },
      },
      // Sort by postCount descending (most active authors first)
      { $sort: { postCount: -1 } },
      // Return only the top 10
      { $limit: 10 },
      // Project only the fields we want to expose
      {
        $project: {
          name: 1,
          followerCount: 1,
          engagementRate: 1,
          category: 1,
          postCount: 1,
        },
      },
    ])

    res.status(200).json({ authors })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/analytics/category-stats
 * Groups all influencers by their category field and returns the count,
 * average followerCount, and average engagementRate per category.
 * Uses MongoDB $group aggregation stage.
 * Returns 200 with { categories: [...] }.
 */
exports.categoryStats = async (req, res) => {
  try {
    const categories = await Author.aggregate([
      // Group all author documents by the category field
      {
        $group: {
          _id: '$category',
          // Count how many authors are in this category
          count: { $sum: 1 },
          // Compute average follower count across all authors in the category
          avgFollowers: { $avg: '$followerCount' },
          // Compute average engagement rate across all authors in the category
          avgEngagement: { $avg: '$engagementRate' },
        },
      },
      // Sort by count descending (largest category first)
      { $sort: { count: -1 } },
      // Rename _id to category and round numeric values for a clean response
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
          avgFollowers: { $round: ['$avgFollowers', 0] },
          avgEngagement: { $round: ['$avgEngagement', 2] },
        },
      },
    ])

    res.status(200).json({ categories })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/analytics/top-brands
 * Ranks brands by how many sponsorship deals they have.
 * Uses aggregation to count sponsorships per brand then populates brand details.
 * Returns 200 with { brands: [...] }.
 */
exports.topBrands = async (req, res) => {
  try {
    const brands = await Sponsorship.aggregate([
      // Group sponsorships by brand and count them
      {
        $group: {
          _id: '$brand',
          sponsorshipCount: { $sum: 1 },
          // Sum all deal values for this brand
          totalDealValue: { $sum: '$dealValue' },
        },
      },
      // Sort by most sponsorships first
      { $sort: { sponsorshipCount: -1 } },
      // Return top 10
      { $limit: 10 },
      // Join with the brands collection to get name and industry
      {
        $lookup: {
          from: 'brands',
          localField: '_id',
          foreignField: '_id',
          as: 'brand',
        },
      },
      // Flatten the brand array (lookup returns an array)
      { $unwind: '$brand' },
      // Shape the final response
      {
        $project: {
          _id: 0,
          brand: { name: 1, industry: 1, country: 1 },
          sponsorshipCount: 1,
          totalDealValue: 1,
        },
      },
    ])

    res.status(200).json({ brands })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/analytics/top-sponsored-influencers
 * Ranks influencers (authors) by number of sponsorship deals they have.
 * Returns 200 with { influencers: [...] }.
 */
exports.topSponsoredInfluencers = async (req, res) => {
  try {
    const influencers = await Sponsorship.aggregate([
      // Group by author and count their sponsorships
      {
        $group: {
          _id: '$author',
          sponsorshipCount: { $sum: 1 },
          totalEarnings: { $sum: '$dealValue' },
        },
      },
      // Sort by most deals first
      { $sort: { sponsorshipCount: -1 } },
      { $limit: 10 },
      // Join with authors collection to get name and follower data
      {
        $lookup: {
          from: 'authors',
          localField: '_id',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: '$author' },
      {
        $project: {
          _id: 0,
          author: { name: 1, followerCount: 1, engagementRate: 1, category: 1 },
          sponsorshipCount: 1,
          totalEarnings: 1,
        },
      },
    ])

    res.status(200).json({ influencers })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/analytics/high-value-campaigns
 * Returns the top 10 sponsorships sorted by dealValue descending.
 * Populates author name and brand name for context.
 * Returns 200 with { campaigns: [...] }.
 */
exports.highValueCampaigns = async (req, res) => {
  try {
    const campaigns = await Sponsorship.find({})
      .sort({ dealValue: -1 })
      .limit(10)
      .populate('author', 'name followerCount category')
      .populate('brand', 'name industry')
      .select('campaignName platform dealValue status startDate endDate author brand')

    res.status(200).json({ campaigns })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
