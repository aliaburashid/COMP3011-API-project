const express = require('express')
const router = express.Router()
const authDataController = require('../auth/dataController')
const dataController = require('./dataController')
const viewController = require('./viewController')

// Inbox – list of conversations
router.get('/', authDataController.auth, dataController.getInboxForView, viewController.inbox)

// Delete message (only sender) – explicit POST route
router.post('/:id/delete', authDataController.auth, dataController.deleteMessageFromWeb, viewController.redirectAfterDelete)

// Conversation with a specific user
router.get('/:userId', authDataController.auth, dataController.getConversationForView, viewController.conversation)

// Send message (form POST)
router.post('/', authDataController.auth, dataController.sendMessageFromWeb, viewController.redirectToConversation)

module.exports = router
