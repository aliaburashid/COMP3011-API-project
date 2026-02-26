require('dotenv').config() // Load environment variables from .env
const mongoose = require('mongoose') // Import Mongoose

// Connect to MongoDB using the MONGO_URI in your .env file
mongoose.connect(process.env.MONGO_URI)

// Export the connection so we can use it in server.js
module.exports = mongoose.connection
