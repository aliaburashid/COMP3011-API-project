const express = require('express')
const router = express.Router()

const viewController = require('./viewController')
const dataController = require('./dataController')
const authDataController = require('../auth/dataController')
const { upload, processImage } = require('../../middleware/upload')

// Feed page (GET /posts)
router.get('/', authDataController.auth, dataController.index, viewController.index)

// New Post Form (GET /posts/new)
router.get('/new', authDataController.auth, viewController.newView)

// Create New Post (POST /posts)
router.post('/', authDataController.auth, upload.single('image'), processImage, dataController.create, viewController.redirectShow)

// Like a post (POST /posts/:id/like)
router.post('/:id/like', authDataController.auth, dataController.likePost, viewController.stayOnPost)

// Save / unsave a post (POST /posts/:id/save)
router.post('/:id/save', authDataController.auth, dataController.toggleSave, viewController.stayOnPost)

// Add a comment to a post (POST /posts/:postId/comments)
router.post('/:postId/comments', authDataController.auth, dataController.addComment, viewController.stayOnPage)

// Delete a comment (DELETE /posts/:postId/comments/:commentId — only the comment author)
router.delete('/:postId/comments/:commentId', authDataController.auth, dataController.deleteComment, viewController.stayOnPage)

// Show Single Post (GET /posts/:id)
router.get('/:id', authDataController.auth, dataController.show, viewController.show)

// Delete Post (DELETE /posts/:id)
router.delete('/:id', authDataController.auth, dataController.deletePost, viewController.redirectToProfile)

module.exports = router
