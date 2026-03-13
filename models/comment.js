/**
 * Comment model – a comment left by an Author on a Post.
 * Each comment belongs to one Post and one Author.
 * When a comment is created its _id is pushed into Post.comments.
 */
const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
  {
    // The post this comment belongs to
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    // The author who wrote the comment
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
    // The text content of the comment
    content: { type: String, required: true, trim: true, maxLength: 500 },
    // Like count on the comment (incremented via dedicated endpoint)
    likesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

// Index for fast lookup of all comments on a post
commentSchema.index({ post: 1, createdAt: -1 })

const Comment = mongoose.model('Comment', commentSchema)
module.exports = Comment
