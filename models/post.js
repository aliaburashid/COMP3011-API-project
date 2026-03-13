/**
 * Post model – content created by an Author (Instagram-style).
 * Each post belongs to one Author.
 * When a post is created its _id is pushed into Author.posts.
 * When deleted it is removed from Author.posts and all its Comments are deleted.
 */
const mongoose = require('mongoose')

const postSchema = new mongoose.Schema(
  {
    // Author who created this post
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
    // Caption text (up to 2200 chars like Instagram)
    caption: { type: String, required: true, trim: true, maxLength: 2200 },
    // URL to the post image
    imageUrl: { type: String, trim: true, default: '' },
    // Optional location tag
    location: { type: String, trim: true, default: '' },
    // Like count – kept in sync with likedBy.length
    likesCount: { type: Number, default: 0, min: 0 },
    // Users who liked this post (used to toggle the heart and prevent double-likes)
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Author' }],
    // Hashtags stored as an array of strings
    hashtags: [{ type: String, trim: true, lowercase: true }],
    // References to Comment documents on this post
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    // Whether only followers can see this post
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
)

postSchema.index({ author: 1, createdAt: -1 })

const Post = mongoose.model('Post', postSchema)
module.exports = Post
