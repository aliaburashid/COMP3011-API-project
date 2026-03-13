const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const commentCtrl = require('../controllers/comments/apiController')

// Comments on a post
router.post('/posts/:id/comments', auth, commentCtrl.createComment)
router.get('/posts/:id/comments', commentCtrl.listComments)

// Individual comment actions
router.delete('/comments/:id', auth, commentCtrl.deleteComment)
router.post('/comments/:id/like', auth, commentCtrl.likeComment)

module.exports = router
