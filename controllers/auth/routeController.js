const express = require('express')
const router = express.Router()

const dataController = require('./dataController')
const viewController = require('./viewController')
const postsViewController = require('../posts/viewController')
const { upload, processImage } = require('../../middleware/upload')

// Sign-up form
router.get('/', viewController.signUp)
// Create account (sets cookie and redirects to feed)
router.post('/', dataController.createAuthor, postsViewController.redirectHome)

// Sign-in form
router.get('/login', viewController.signIn)
// Login → redirect to feed
router.post('/login', dataController.loginAuthor, postsViewController.redirectHome)

// Profile page
router.get('/profile', dataController.auth, dataController.showProfile, viewController.showProfile)

// Edit profile form
router.get('/edit', dataController.auth, dataController.editProfileView)
// Save profile edits
router.put('/profile', dataController.auth, upload.single('profilePicture'), processImage, dataController.updateProfile, viewController.redirectToProfile)

// Logout
router.post('/logout', dataController.logout, viewController.redirectToLogin)

// Followers / following lists (must be before /:id wildcard)
router.get('/followers', dataController.auth, dataController.showFollowers, viewController.showFollowList)
router.get('/following', dataController.auth, dataController.showFollowing, viewController.showFollowList)

// Public author profile (view any user)
router.get('/:id', dataController.auth, dataController.showAuthorProfile, viewController.showAuthorProfile)

// Follow / Unfollow from web
router.post('/:id/follow', dataController.auth, dataController.followAuthor, viewController.redirectToAuthorProfile)
router.post('/:id/unfollow', dataController.auth, dataController.unfollowAuthor, viewController.redirectToAuthorProfile)

module.exports = router
