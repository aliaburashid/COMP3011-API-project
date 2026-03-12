const express = require('express')
const router = express.Router()
const analyticsController = require('../controllers/analytics/apiController')

// All analytics endpoints are public – no auth required

// Influencer analytics
router.get('/analytics/top-influencers', analyticsController.topInfluencers)
router.get('/analytics/most-liked-posts', analyticsController.mostLikedPosts)
router.get('/analytics/most-active-authors', analyticsController.mostActiveAuthors)
router.get('/analytics/category-stats', analyticsController.categoryStats)

// Sponsorship analytics
router.get('/analytics/top-brands', analyticsController.topBrands)
router.get('/analytics/top-sponsored-influencers', analyticsController.topSponsoredInfluencers)
router.get('/analytics/high-value-campaigns', analyticsController.highValueCampaigns)

module.exports = router
