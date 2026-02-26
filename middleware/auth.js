// JWT library to verify and decode tokens
const jwt = require('jsonwebtoken')
// Author model to load the user from the database
const Author = require('../models/author')

/**
 * Protect routes: validate JWT, load author, set req.user.
 * Token from query (?token=) or Authorization header (Bearer <token>).
 */
const auth = async (req, res, next) => {
  try {
    // Get token from query string (?token=...) or from Authorization header (Bearer <token>)
    const token = req.query.token || req.headers.authorization?.split(' ')[1]

    // Reject request if no token was provided
    if (!token) throw new Error('Token missing')

    // Verify token and decode payload; throws if token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    // Load the author from the database using the ID stored in the token
    const user = await Author.findById(decoded._id)

    // Reject if author was deleted after the token was issued
    if (!user) throw new Error('User not found')

    // Attach the author to the request so the next handler can use req.user
    req.user = user
    // Continue to the next middleware or route handler
    next()
  } catch (err) {
    // Send 401 Unauthorized with a JSON error response
    res.status(401).json({ message: 'Not authorized', error: err.message })
  }
}

// Export the middleware so routes can use it (e.g. router.get('/profile', auth, ...))
module.exports = auth
