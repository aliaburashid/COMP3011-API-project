const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth/apiController')
const auth = require('../middleware/auth')

// Create & login (no token required)
router.post('/auth/signup', authController.createAuthor)
router.post('/auth/login', authController.loginAuthor)

// Author CRUD – list and show are public; profile, update, delete require auth
router.get('/authors', authController.indexAuthors)
router.get('/authors/profile', auth, authController.getProfile)
router.get('/authors/:id', authController.showAuthor)
router.put('/authors/:id', auth, authController.updateAuthor)
router.delete('/authors/:id', auth, authController.deleteAuthor)

// Social: follow / unfollow (auth required)
router.post('/authors/:id/follow', auth, authController.followAuthor)
router.post('/authors/:id/unfollow', auth, authController.unfollowAuthor)

module.exports = router
