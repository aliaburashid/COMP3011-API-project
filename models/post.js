/**
 * Post model – content created by an influencer (Author).
 * Each post belongs to one Author (one-to-many relationship).
 * When a post is created, its _id is pushed into Author.posts.
 * When deleted, it is removed from Author.posts.
 */
const mongoose = require('mongoose')

const postSchema = new mongoose.Schema(
  {
    // Reference to the Author who created this post (required)
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },

    // The main text/caption of the post (required)
    caption: { type: String, required: true, trim: true, maxLength: 2200 },

    // Optional URL to the image for this post
    imageUrl: { type: String, trim: true, default: '' },

    // Stored as a count for easy sorting and analytics (not an array of user IDs)
    likesCount: { type: Number, default: 0, min: 0 },

    // Hashtags extracted from the caption (e.g. ['travel', 'lifestyle'])
    hashtags: [{ type: String, trim: true, lowercase: true }],
  },
  // Automatically adds createdAt and updatedAt fields
  { timestamps: true }
)

// Index to make listing posts by author fast (used in GET /api/authors/:id/posts)
postSchema.index({ author: 1, createdAt: -1 })

const Post = mongoose.model('Post', postSchema)
module.exports = Post
