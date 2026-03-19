const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth/apiController')
const postController = require('../controllers/posts/apiController')
const auth = require('../middleware/auth')

// --- Auth (no token required) ---
router.post('/auth/signup', authController.createAuthor)
router.post('/auth/login', authController.loginAuthor)


// --- Authors ---
router.get('/authors', authController.indexAuthors)
router.get('/authors/profile', auth, authController.getProfile) // Must be before /authors/:id
router.get('/authors/saved', auth, postController.getSaved)     // Must be before /authors/:id
router.get('/authors/:id', authController.showAuthor)
router.put('/authors/:id', auth, authController.updateAuthor)
router.delete('/authors/:id', auth, authController.deleteAuthor)


// Social: follow / unfollow (auth required)
router.post('/authors/:id/follow', auth, authController.followAuthor)
router.post('/authors/:id/unfollow', auth, authController.unfollowAuthor)


// Posts by a specific author (public)
router.get('/authors/:id/posts', postController.listByAuthor)

// --- Posts ---
router.post('/posts', auth, postController.createPost)           // Create (auth required)
router.get('/posts', postController.indexPosts)                   // List all (public)
router.get('/posts/:id', postController.showPost)                 // Get one (public)
router.put('/posts/:id', auth, postController.updatePost)         // Update own post (auth required)
router.delete('/posts/:id', auth, postController.deletePost)      // Delete own post (auth required)
router.post('/posts/:id/like', auth, postController.likePost)     // Like a post (auth required)

module.exports = router
