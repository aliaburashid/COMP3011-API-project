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
