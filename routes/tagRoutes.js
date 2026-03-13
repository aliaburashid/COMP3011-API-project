const express = require('express')
const router = express.Router()
const tagController = require('../controllers/tags/apiController')

router.get('/', tagController.listTags)
router.get('/:tag', tagController.showTag)

module.exports = router
