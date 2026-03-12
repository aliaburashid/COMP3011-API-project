const express = require('express')
const router = express.Router()
const sponsorshipController = require('../controllers/sponsorships/apiController')
const auth = require('../middleware/auth')

router.post('/sponsorships', auth, sponsorshipController.createSponsorship)       // Create (auth required)
router.get('/sponsorships', sponsorshipController.indexSponsorships)               // List all (public)
router.get('/sponsorships/:id', sponsorshipController.showSponsorship)             // Get one (public)
router.put('/sponsorships/:id', auth, sponsorshipController.updateSponsorship)     // Update (auth required)
router.delete('/sponsorships/:id', auth, sponsorshipController.deleteSponsorship)  // Delete (auth required)

module.exports = router
