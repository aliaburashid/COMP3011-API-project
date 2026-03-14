/**
 * Auth data controller — handles authentication, profile, explore, and follow logic.
 * Uses JWT for sessions; supports cookie and Authorization header tokens.
 */
const Author = require('../../models/author')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

/**
 * Protects routes by verifying JWT. Token can come from cookie, query param, or Authorization header.
 * Attaches decoded author to req.author; returns 401 if invalid or missing.
 */
exports.auth = async (req, res, next) => {
  try {
    let token
    if (req.cookies?.token) {
      token = req.cookies.token
    } else if (req.query.token) {
      token = req.query.token
    } else if (req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '')
    } else {
      throw new Error('No token provided')
    }
    const data = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const author = await Author.findOne({ _id: data._id })
    if (!author) throw new Error()
    req.author = author
    res.locals.data.token = token
    next()
  } catch (error) {
    res.status(401).json({ message: 'Not authorized', error: error.message })
  }
}

// ---------------------------------------------------------------------------
// Registration & login
// ---------------------------------------------------------------------------

/**
 * Registers a new author. Hashes password via model pre-save; generates JWT and sets httpOnly cookie.
 * Handles duplicate email (Mongo E11000) with user-friendly message for web view.
 */
exports.createAuthor = async (req, res, next) => {
  try {
    const author = new Author(req.body)
    await author.save()
    const token = await author.generateAuthToken()
    res.locals.data.token = token
    req.author = author
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
    next()
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      res.locals.data = { error: 'Email already exists. Please use a different one.' }
      return res.render('auth/SignUp', { error: res.locals.data.error })
    }
    res.status(400).json({ message: error.message })
  }
}

/**
 * Logs in an existing author. Compares password with bcrypt; generates JWT and sets httpOnly cookie.
 * Returns same error message for wrong email/password to avoid username enumeration.
 */
exports.loginAuthor = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const author = await Author.findOne({ email })
    if (!author) {
      return res.status(400).render('auth/SignIn', { error: 'Invalid login credentials' })
    }
    const isMatch = await bcrypt.compare(password, author.password)
    if (!isMatch) {
      return res.status(400).render('auth/SignIn', { error: 'Invalid login credentials' })
    }
    const token = await author.generateAuthToken()
    res.locals.data.token = token
    req.author = author
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
    next()
  } catch (error) {
    res.status(500).render('auth/SignIn', { error: 'Server error. Please try again.' })
  }
}

// ---------------------------------------------------------------------------
// Profile (own)
// ---------------------------------------------------------------------------

/**
 * Fetches the logged-in user's profile with posts and saved posts populated.
 * Tab defaults to 'posts' for Posts/Saved toggle on profile page.
 */
exports.showProfile = async (req, res, next) => {
  try {
    const profile = await Author.findById(req.author._id)
      .populate({ path: 'posts', options: { sort: { createdAt: -1 } } })
      .populate({ path: 'savedPosts', populate: { path: 'author', select: 'name' } })
    if (!profile) throw new Error('Profile not found')
    res.locals.data.profile = profile
    res.locals.data.tab = req.query.tab || 'posts'
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

/**
 * Renders the edit profile form for the logged-in user.
 */
exports.editProfileView = async (req, res) => {
  try {
    const author = await Author.findById(req.author._id)
    res.render('auth/EditProfile', { author, token: res.locals.data.token })
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
}

/**
 * Updates profile: bio, name (optional), and profile picture if multer uploaded a file.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = { bio: req.body.bio }
    if (req.body.name) updates.name = req.body.name
    if (req.file) updates.profilePicture = req.file.path
    await Author.findByIdAndUpdate(req.author._id, updates)
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// ---------------------------------------------------------------------------
// Followers / Following
// ---------------------------------------------------------------------------

/**
 * Loads the logged-in user's followers and sets res.locals.data.users for rendering.
 */
exports.showFollowers = async (req, res, next) => {
  try {
    const author = await Author.findById(req.author._id)
      .populate('followers', 'name profilePicture bio')
    res.locals.data.users = author.followers
    res.locals.data.title = 'Followers'
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

/**
 * Loads the logged-in user's following list and sets res.locals.data.users for rendering.
 */
exports.showFollowing = async (req, res, next) => {
  try {
    const author = await Author.findById(req.author._id)
      .populate('following', 'name profilePicture bio')
    res.locals.data.users = author.following
    res.locals.data.title = 'Following'
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// ---------------------------------------------------------------------------
// Explore & public profiles
// ---------------------------------------------------------------------------

/**
 * Lists authors with optional search by name or category (query param `q`).
 * Sorted by followerCount desc; limited to 200 results.
 */
exports.explore = async (req, res, next) => {
  try {
    const q = req.query.q ? req.query.q.trim() : ''
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } },
          ],
        }
      : {}
    res.locals.data.authors = await Author.find(filter)
      .select('name profilePicture bio category followers followerCount')
      .sort({ followerCount: -1 })
      .limit(200)
    res.locals.data.query = q
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

/**
 * Fetches a public author profile by ID. Excludes password; populates posts.
 * Sets isFollowing so the view can show Follow/Unfollow button correctly.
 */
exports.showAuthorProfile = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id)
      .select('-password')
      .populate({ path: 'posts', options: { sort: { createdAt: -1 } } })
    if (!author) return res.status(404).send({ message: 'User not found' })
    res.locals.data.author = author
    res.locals.data.currentUser = req.author ? req.author._id : null
    // Check if logged-in user already follows this author
    res.locals.data.isFollowing = req.author
      ? req.author.following.some((f) => f.toString() === req.params.id)
      : false
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// ---------------------------------------------------------------------------
// Follow / Unfollow
// ---------------------------------------------------------------------------

/**
 * Follows the author specified by req.params.id. Delegates to Author.follow().
 */
exports.followAuthor = async (req, res, next) => {
  try {
    await req.author.follow(req.params.id)
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

/**
 * Unfollows the author specified by req.params.id. Delegates to Author.unfollow().
 */
exports.unfollowAuthor = async (req, res, next) => {
  try {
    await req.author.unfollow(req.params.id)
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

/**
 * Clears the auth cookie and res.locals.data.token. Calls next() for response handling.
 */
exports.logout = async (req, res, next) => {
  try {
    res.clearCookie('token')
    res.locals.data.token = null
    if (req.author) req.author = null
    next()
  } catch (error) {
    res.status(500).send({ message: error.message })
  }
}
