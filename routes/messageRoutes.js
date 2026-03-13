const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const msgCtrl = require('../controllers/messages/apiController')

// All message routes require authentication
router.post('/messages', auth, msgCtrl.sendMessage)
router.get('/messages/inbox', auth, msgCtrl.getInbox)
router.get('/messages/sent', auth, msgCtrl.getSent)
router.get('/messages/conversation/:userId', auth, msgCtrl.getConversation)
router.get('/messages/:id', auth, msgCtrl.getMessage)
router.delete('/messages/:id', auth, msgCtrl.deleteMessage)
router.put('/messages/:id/read', auth, msgCtrl.markAsRead)

module.exports = router
