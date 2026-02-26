/**
 * Author model – users who can sign up, log in, and own content (e.g. posts).
 * Supports full CRUD via API; password hashing and JWT for auth.
 * Refs (posts, comments, followers, following) support future endpoints and dataset/seed data.
 */
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// define the schema for the author model
const authorSchema = new mongoose.Schema(
  {
    // Required for signup and API validation
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minLength: 6 },

    // profile fields 
    bio: { type: String, default: '', maxLength: 500 },
    profilePicture: { type: String, default: '/images/default-avatar.png', trim: true },
    website: { type: String, trim: true },
    location: { type: String, trim: true },
    isPrivate: { type: Boolean, default: false },

    // Refs for relations 
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Author' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Author' }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  },
  { timestamps: true }
)

// Index for fast lookup by email (login, uniqueness)
authorSchema.index({ email: 1 })

// Never send password in JSON 
// automatically removes the password field when sending author data in an API response. Safer!
authorSchema.methods.toJSON = function () {
  const author = this.toObject()
  delete author.password
  return author
}

// Hash password before saving
// Before saving a user, this checks if the password is new or changed, and then hashes it using bcrypt.
authorSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

// Generate JWT token for API auth – use same secret as middleware/auth.js (env preferred)
// This method creates a JWT token containing the author’s ID. 
// You’ll use this for logging in and accessing protected routes.
authorSchema.methods.generateAuthToken = function () {
  const secret = process.env.JWT_SECRET || 'secret'
  return jwt.sign({ _id: this._id }, secret)
}

// --- Follow: add another author to "this" author's following list (and add this to their followers)
authorSchema.methods.follow = async function (userId) {
  // Normalise to string so we can compare ObjectIds safely
  const id = userId.toString()
  // If we already follow them, do nothing (avoid duplicates)
  if (this.following.some((f) => f.toString() === id)) return
  // Add their ID to our "following" array
  this.following.push(userId)
  // Persist our document
  await this.save()

  // Get the other author's document so we can update their "followers" list
  const Author = mongoose.model('Author')
  const target = await Author.findById(userId)
  // If they exist and don't already have us in followers, add us
  if (target && !target.followers.some((f) => f.toString() === this._id.toString())) {
    target.followers.push(this._id)
    await target.save()
  }
}

// --- Unfollow: remove another author from "this" author's following list (and remove this from their followers)
authorSchema.methods.unfollow = async function (userId) {
  // Normalise to string for comparison
  const id = userId.toString()
  // Remove their ID from our "following" array (keep everyone except userId)
  this.following = this.following.filter((f) => f.toString() !== id)
  // Persist our document
  await this.save()

  // Get the other author so we can remove us from their "followers" list
  const Author = mongoose.model('Author')
  const target = await Author.findById(userId)
  if (target) {
    // Remove our ID from their "followers" array
    target.followers = target.followers.filter((f) => f.toString() !== this._id.toString())
    await target.save()
  }
}

const Author = mongoose.model('Author', authorSchema)
module.exports = Author
