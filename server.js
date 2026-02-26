require('dotenv').config()
const app = require('./app')
const db = require('./models/db')

const PORT = process.env.PORT || 3000

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

if (process.env.MONGO_URI) {
  db.once('open', () => {
    console.log('Connected to MongoDB')
    startServer()
  })
  db.on('error', (error) => {
    console.error('MongoDB connection error:', error.message)
  })
} else {
  startServer()
}
