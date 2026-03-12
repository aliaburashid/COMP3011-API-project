const express = require('express')
const router = express.Router()
const brandController = require('../controllers/brands/apiController')
const auth = require('../middleware/auth')

router.post('/brands', auth, brandController.createBrand)       // Create (auth required)
router.get('/brands', brandController.indexBrands)               // List all (public)
router.get('/brands/:id', brandController.showBrand)             // Get one (public)
router.put('/brands/:id', auth, brandController.updateBrand)     // Update (auth required)
router.delete('/brands/:id', auth, brandController.deleteBrand)  // Delete (auth required)

module.exports = router
