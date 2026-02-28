/**
 * Auth API controller: signup, login, and middleware to protect routes.
 * Used by API routes only (JSON responses).
 */
const Author = require('../../models/author')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

/**
 * Middleware: protect routes by validating JWT.
 * Expects token in Authorization header (Bearer <token>) or query (?token=).
 * On success sets req.user to the author document; on failure sends 401 JSON.
 */
exports.auth = async (req, res, next) => {
  try {
    // Get token from Authorization header (strip "Bearer ") or from query string
    const token =
      req.header('Authorization')?.replace('Bearer ', '') ||
      req.query.token

    // Reject if no token was sent
    if (!token) throw new Error('No token provided')

    // Decode and verify the JWT; throws if invalid or expired
    const data = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    // Load the author document by ID from the token
    const author = await Author.findOne({ _id: data._id })

    // Reject if author was deleted after token was issued
    if (!author) throw new Error('Author not found')

    // Attach author to request so the next handler can use req.user
    req.user = author
    next()
  } catch (error) {
    // Send 401 Unauthorized with error message
    res.status(401).json({ message: 'Not authorized', error: error.message })
  }
}

/**
 * POST signup: create a new author.
 * Body: name, email, password (all required).
 * Returns 201 with { author, token }; 400 on validation/duplicate error.
 */
exports.createAuthor = async (req, res) => {
  try {
    // Validate that required fields are present
    if (!req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    // Create a new Author from request body (password will be hashed by model pre-save)
    const author = new Author(req.body)
    await author.save()
    // Generate JWT so client can use it for protected requests
    const token = await author.generateAuthToken()
    res.status(201).json({ author, token })
  } catch (error) {
    // Duplicate email or validation error (e.g. from Mongoose)
    res.status(400).json({ message: error.message })
  }
}

/**
 * POST login: authenticate by email + password.
 * Body: email, password.
 * Returns { author, token }; 400 if credentials invalid.
 */
exports.loginAuthor = async (req, res) => {
  try {
    // Find author by email
    const author = await Author.findOne({ email: req.body.email })
    // If not found or password doesn't match hash, reject
    if (!author || !(await bcrypt.compare(req.body.password, author.password))) {
      return res.status(400).json({ message: 'Invalid login credentials' })
    }
    // Generate JWT for this session
    const token = await author.generateAuthToken()
    res.json({ author, token })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * GET profile: return the authenticated user's profile (req.user set by auth middleware).
 * Optionally populate posts for "profile and associated content".
 * Returns 200 with { author }; use after auth middleware.
 */
exports.getProfile = async (req, res) => {
  try {
    // Send the logged-in author (password already hidden by model toJSON)
    // Posts will be populated once the Post model is added
    res.status(200).json({ author: req.user })
  } catch (error) {
    // Server error
    res.status(500).json({ message: error.message })
  }
}

// --- Full CRUD for Author (coursework: one data model with full CRUD linked to database)

/**
 * GET index: list all authors (JSON; password hidden via model toJSON).
 * Returns 200 with { authors: [...] }.
 */
exports.indexAuthors = async (req, res) => {
  try {
    // Fetch all authors from DB; sort by newest first (createdAt descending)
    const authors = await Author.find({}).sort({ createdAt: -1 })
    // Send as JSON; each author's password is stripped by model toJSON
    res.status(200).json({ authors })
  } catch (error) {
    // DB or other server error
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET show: one author by id.
 * Returns 200 with { author }; 404 if not found.
 */
exports.showAuthor = async (req, res) => {
  try {
    // id comes from the URL, e.g. GET /api/authors/507f1f77bcf86cd799439011
    const author = await Author.findById(req.params.id)
    // No document with that id in the database
    if (!author) return res.status(404).json({ message: 'Author not found' })
    res.status(200).json({ author })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * PUT update: update author by id (auth required; only own account).
 * Partial update; password only if provided and length >= 6.
 * Returns 200 with { author }; 403 if not own account; 404 if not found; 400 on validation error.
 */
exports.updateAuthor = async (req, res) => {
  try {
    // Only allow updating your own account (req.user from auth middleware)
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: you can only update your own account' })
    }
    // Whitelist: only these fields can be updated from the request body
    const allowed = ['name', 'bio', 'profilePicture', 'website', 'location', 'isPrivate']
    const updates = {}
    // Copy each allowed field from req.body into updates if it was sent
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    })
    // Allow password change only if provided and at least 6 chars (model will hash it)
    if (req.body.password && req.body.password.length >= 6) updates.password = req.body.password

    // Find the author by URL id and apply updates; new: true returns the updated doc
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    if (!author) return res.status(404).json({ message: 'Author not found' })
    res.status(200).json({ author })
  } catch (error) {
    // Validation or duplicate error from Mongoose
    res.status(400).json({ message: error.message })
  }
}

/**
 * DELETE: remove author by id (auth required; only own account).
 * Returns 204 no content; 403 if not own account; 404 if not found.
 */
exports.deleteAuthor = async (req, res) => {
  try {
    // Only allow deleting your own account
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: you can only delete your own account' })
    }
    // Remove the author document from the database; returns the deleted doc or null
    const author = await Author.findByIdAndDelete(req.params.id)
    if (!author) return res.status(404).json({ message: 'Author not found' })
    // 204 = success, no response body (REST convention for delete)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// --- Social: follow / unfollow (Instagram-style, auth required)

/**
 * POST /authors/:id/follow – follow another author.
 * Auth required; cannot follow yourself.
 * Updates both authors' followers/following arrays atomically.
 * Returns 200 with { message, followingCount }.
 */
exports.followAuthor = async (req, res) => {
  try {
    // Prevent following yourself
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' })
    }
    // Check the target author exists before following
    const target = await Author.findById(req.params.id)
    if (!target) return res.status(404).json({ message: 'Author not found' })

    // Call the follow method on the model (updates both documents)
    await req.user.follow(req.params.id)

    // Return updated following count so the client knows the new state
    res.status(200).json({
      message: `You are now following ${target.name}`,
      followingCount: req.user.following.length
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * POST /authors/:id/unfollow – unfollow an author.
 * Auth required.
 * Returns 200 with { message, followingCount }.
 */
exports.unfollowAuthor = async (req, res) => {
  try {
    // Prevent unfollowing yourself (no-op but cleaner to reject)
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' })
    }
    // Check the target author exists
    const target = await Author.findById(req.params.id)
    if (!target) return res.status(404).json({ message: 'Author not found' })

    // Call the unfollow method on the model (updates both documents)
    await req.user.unfollow(req.params.id)

    // Return updated following count
    res.status(200).json({
      message: `You have unfollowed ${target.name}`,
      followingCount: req.user.following.length
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
