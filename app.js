// import required packages 
const express = require('express') //  Web framework for Node.js
const morgan = require('morgan') // Logs requests in your terminal (for debugging)

// set up the app
const app = express()

// Middleware (API only)
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Adds a blank res.locals.data object to every request for future routes 
// that pass data between middleware (e.g. dataController ->apiController)
app.use((req, res, next) => {
  res.locals.data = {}
  next()
})

// API routes (JSON only)
const apiRoutes = require('./routes/apiRoutes')
app.use('/api', apiRoutes)

// Health/root
app.get('/', (req, res) => {
  res.json({ message: 'COMP3011 API is running' })
})

module.exports = app
