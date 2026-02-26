// Import Express and Morgan
const express = require('express');
const morgan = require('morgan');

// Create an Express app
const app = express();

// Morgan: HTTP request logger (logs method, path, status, response time to terminal)
app.use(morgan('dev'));

// Parse JSON request bodies (needed for POST/PUT)
app.use(express.json());

// Custom middleware 1: runs for every request, then passes to next
app.use((req, res, next) => {
  console.log('Middleware 1: Logging request details');
  next();
});

// Custom middleware 2: runs after middleware 1, then passes to route
app.use((req, res, next) => {
  console.log('Middleware 2: Performing some operation');
  next();
});

// Define routes here
app.get('/', (req, res) => {
  res.json({ message: 'COMP3011 API is running' });
});

// Lesson: GET /home (req = request, res = response)
app.get('/home', (req, res) => {
  res.send('<h1>Home Page</h1>');
});

// Lesson: URL params - GET /greet/:name (specific route before any /:param)
app.get('/greet/:name', (req, res) => {
  res.send(`Hello, ${req.params.name}!`);
});

// Lesson: Query params - GET /hello?name=...&age=...
app.get('/hello', (req, res) => {
  const name = req.query.name;
  const age = req.query.age;
  res.send(`Hello there, ${name}! I hear you are ${age} years old!`);
});

// Listen for requests on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
