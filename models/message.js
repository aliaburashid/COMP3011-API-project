/**
 * Message model – a direct message (DM) between two Authors.
 * Represents a one-way message; a conversation is the set of messages
 * exchanged between two users in both directions.
 */
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    // Who sent the message
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
    // Who received the message
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
    // The message text
    content: { type: String, required: true, trim: true, maxLength: 1000 },
    // Whether the recipient has read it
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Fast lookup for inbox (messages received by a user) and conversations
messageSchema.index({ recipient: 1, createdAt: -1 })
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 })

const Message = mongoose.model('Message', messageSchema)
module.exports = Message
