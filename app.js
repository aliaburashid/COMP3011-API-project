const express = require('express')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const jsxEngine = require('jsx-view-engine')
const methodOverride = require('method-override')

const app = express()

// View engine
app.set('view engine', 'jsx')
app.engine('jsx', jsxEngine())

// Middleware
app.use(morgan('dev'))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

app.use((req, res, next) => {
  res.locals.data = {}
  next()
})

app.use(express.static('public'))

// ── Web Routes (server-rendered views) ────────────────────────────────────────
const authorRoutes = require('./controllers/auth/routeController')
const postRoutes = require('./controllers/posts/routeController')
const authDataController = require('./controllers/auth/dataController')
const authViewController = require('./controllers/auth/viewController')

app.use('/authors', authorRoutes)
app.use('/posts', postRoutes)

// Explore / search people
app.get('/explore', authDataController.auth, authDataController.explore, authViewController.explore)

// Saved posts
const postsDataController = require('./controllers/posts/dataController')
const postsViewController = require('./controllers/posts/viewController')
app.get('/saved', authDataController.auth, postsDataController.savedFeed, postsViewController.savedFeed)

// Hashtag pages
app.get('/tags/:tag', authDataController.auth, postsDataController.hashtagFeed, postsViewController.hashtagFeed)

// Messages (DMs)
const messageWebRoutes = require('./controllers/messages/routeController')
app.use('/messages', messageWebRoutes)

// ── API Routes (JSON) ──────────────────────────────────────────────────────────
const apiRoutes = require('./routes/apiRoutes')           // auth + authors + posts
app.use('/api', apiRoutes)

const commentRoutes = require('./routes/commentRoutes')   // comments
app.use('/api', commentRoutes)

const messageRoutes = require('./routes/messageRoutes')   // direct messages
app.use('/api', messageRoutes)

const tagRoutes = require('./routes/tagRoutes')           // hashtags
app.use('/api/tags', tagRoutes)

// Save/unsave + saved feed API routes
const postApiController = require('./controllers/posts/apiController')
const auth = require('./middleware/auth')
app.post('/api/posts/:id/save', auth, postApiController.savePost)
app.get('/api/authors/saved', auth, postApiController.getSaved)

// Root → redirect to sign-in
app.get('/', (req, res) => {
  res.redirect('/authors/login')
})

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` })
})

module.exports = app
