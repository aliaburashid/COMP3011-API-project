/**
 * Message data controller – server-side logic for the messaging web UI.
 * Uses req.author from auth middleware (cookie-based).
 */
const Message = require('../../models/message')
const Author = require('../../models/author')
const mongoose = require('mongoose')

/**
 * Build a list of conversations for the inbox.
 * Each conversation = current user + one other person, with latest message and unread count.
 */
exports.getInboxForView = async (req, res, next) => {
  try {
    const userId = req.author._id

    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name profilePicture')
      .populate('recipient', 'name profilePicture')
      .lean()

    const convMap = new Map()
    for (const m of messages) {
      const otherId = m.sender._id.toString() === userId.toString()
        ? m.recipient._id
        : m.sender._id
      const otherIdStr = otherId.toString()
      if (!convMap.has(otherIdStr)) {
        convMap.set(otherIdStr, {
          otherUser: m.sender._id.toString() === userId.toString() ? m.recipient : m.sender,
          latestMessage: m,
          unreadCount: 0,
        })
      }
      const conv = convMap.get(otherIdStr)
      if (m.recipient._id.toString() === userId.toString() && !m.read) {
        conv.unreadCount++
      }
    }

    const conversations = Array.from(convMap.values())
      .map((c) => ({
        otherUser: c.otherUser,
        latestMessage: c.latestMessage,
        unreadCount: c.unreadCount,
      }))
      .sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt))

    res.locals.data.conversations = conversations
    res.locals.data.unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0)
    next()
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
}

/**
 * Get conversation between current user and :userId. Populate sender/recipient.
 */
exports.getConversationForView = async (req, res, next) => {
  try {
    const userId = req.author._id
    const otherId = req.params.userId

    if (!mongoose.Types.ObjectId.isValid(otherId) || otherId === userId.toString()) {
      return res.redirect('/messages')
    }

    const otherUser = await Author.findById(otherId).select('name profilePicture').lean()
    if (!otherUser) return res.redirect('/messages')

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherId },
        { sender: otherId, recipient: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name profilePicture')
      .populate('recipient', 'name profilePicture')
      .lean()

    await Message.updateMany(
      { sender: otherId, recipient: userId, read: false },
      { read: true }
    )

    res.locals.data.messages = messages
    res.locals.data.otherUser = otherUser
    res.locals.data.otherUserId = otherId
    next()
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
}

/**
 * Delete a message – only the sender can delete (auth required).
 * Puts recipientId in res.locals for redirect after delete.
 */
exports.deleteMessageFromWeb = async (req, res, next) => {
  try {
    const messageId = req.params.id
    const userId = req.author._id

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).send({ message: 'Invalid message id' })
    }

    const message = await Message.findById(messageId)
    if (!message) return res.status(404).send({ message: 'Message not found' })

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).send({ message: 'Forbidden: only the sender can delete a message' })
    }

    const recipientId = message.recipient.toString()
    await message.deleteOne()

    res.locals.data.redirectRecipientId = recipientId
    next()
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
}

/**
 * Send a message from the web form. Body: recipientId, content.
 */
exports.sendMessageFromWeb = async (req, res, next) => {
  try {
    const { recipientId, content } = req.body

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).send({ message: 'Invalid or missing recipientId' })
    }
    if (recipientId === req.author._id.toString()) {
      return res.status(400).send({ message: 'You cannot message yourself' })
    }
    if (!content || !String(content).trim()) {
      return res.status(400).send({ message: 'Message content is required' })
    }

    const recipient = await Author.findById(recipientId)
    if (!recipient) return res.status(404).send({ message: 'Recipient not found' })

    const message = new Message({
      sender: req.author._id,
      recipient: recipientId,
      content: String(content).trim().slice(0, 1000),
    })
    await message.save()

    next()
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
}
