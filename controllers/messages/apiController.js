/**
 * Message (DM) API controller – direct messages between Authors.
 *
 * Endpoints:
 *   POST   /api/messages                       → sendMessage       (auth required)
 *   GET    /api/messages/inbox                 → getInbox          (auth required)
 *   GET    /api/messages/sent                  → getSent           (auth required)
 *   GET    /api/messages/conversation/:userId  → getConversation   (auth required)
 *   GET    /api/messages/:id                   → getMessage        (auth required)
 *   DELETE /api/messages/:id                   → deleteMessage     (auth + sender)
 *   PUT    /api/messages/:id/read              → markAsRead        (auth + recipient)
 */
const mongoose = require('mongoose')
const Message = require('../../models/message')
const Author = require('../../models/author')

/**
 * POST /api/messages
 * Send a direct message to another user.
 * Body: recipientId (required), content (required)
 * Returns 201 with { message }; 400 for bad id or missing fields; 404 if recipient not found.
 */
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid or missing recipientId' })
    }
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot message yourself' })
    }

    const recipient = await Author.findById(recipientId)
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' })

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
    })
    await message.save()
    await message.populate([
      { path: 'sender', select: 'name profilePicture' },
      { path: 'recipient', select: 'name profilePicture' },
    ])

    res.status(201).json({ message })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * GET /api/messages/inbox
 * Get all messages received by the logged-in user, newest first.
 * Returns 200 with { messages, unreadCount }.
 */
exports.getInbox = async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate('sender', 'name profilePicture')

    const unreadCount = messages.filter(m => !m.read).length

    res.status(200).json({ messages, unreadCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/messages/sent
 * Get all messages sent by the logged-in user.
 * Returns 200 with { messages }.
 */
exports.getSent = async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user._id })
      .sort({ createdAt: -1 })
      .populate('recipient', 'name profilePicture')

    res.status(200).json({ messages })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/messages/conversation/:userId
 * Get the full conversation (both directions) between the logged-in user and another user.
 * Returns 200 with { messages }; 400 for bad userId.
 */
exports.getConversation = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user id' })
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name profilePicture')
      .populate('recipient', 'name profilePicture')

    // Mark unread messages in this conversation as read
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.user._id, read: false },
      { read: true }
    )

    res.status(200).json({ messages, count: messages.length })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/messages/:id
 * Get a single message by id.
 * Only sender or recipient can view it.
 * Returns 200 with { message }; 400 for bad id; 403 if not participant; 404 if not found.
 */
exports.getMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message id' })
    }

    const message = await Message.findById(req.params.id)
      .populate('sender', 'name profilePicture')
      .populate('recipient', 'name profilePicture')

    if (!message) return res.status(404).json({ message: 'Message not found' })

    const userId = req.user._id.toString()
    const isSender = message.sender._id.toString() === userId
    const isRecipient = message.recipient._id.toString() === userId

    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Forbidden: you are not a participant in this message' })
    }

    res.status(200).json({ message })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * DELETE /api/messages/:id
 * Delete a message – only the sender can delete it.
 * Returns 204; 400 for bad id; 403 if not sender; 404 if not found.
 */
exports.deleteMessage = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message id' })
    }

    const message = await Message.findById(req.params.id)
    if (!message) return res.status(404).json({ message: 'Message not found' })

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: only the sender can delete a message' })
    }

    await message.deleteOne()
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * PUT /api/messages/:id/read
 * Mark a message as read – only the recipient can do this.
 * Returns 200 with { read: true }; 400 for bad id; 403 if not recipient; 404 if not found.
 */
exports.markAsRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message id' })
    }

    const message = await Message.findById(req.params.id)
    if (!message) return res.status(404).json({ message: 'Message not found' })

    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: only the recipient can mark a message as read' })
    }

    message.read = true
    await message.save()

    res.status(200).json({ read: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
