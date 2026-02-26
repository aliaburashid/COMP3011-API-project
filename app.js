const express = require('express')
const morgan = require('morgan')

const app = express()

// Middleware (API only – no views, no forms)
app.use(morgan('dev'))
app.use(express.json())

// Optional: for future routes that pass data between middleware (e.g. dataController → apiController)
app.use((req, res, next) => {
  res.locals.data = {}
  next()
})

// Routes – add your API routes here or mount a router later, e.g. app.use('/api', apiRoutes)
app.get('/', (req, res) => {
  res.json({ message: 'COMP3011 API is running' })
})

module.exports = app
