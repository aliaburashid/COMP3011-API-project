# 📸 FlickGallery - REST API Social Media Platform

> **A modern, full-stack web application demonstrating REST API concepts with Node.js, Express, MongoDB, and JSX View Engine**

![FlickGallery Logo](https://img.shields.io/badge/FlickGallery-REST--API-blue?style=for-the-badge&logo=nodejs)

## 🚀 Project Overview

FlickGallery is a REST API demonstration project that showcases modern web development concepts with an Instagram-inspired interface. The project focuses on demonstrating RESTful API design, CRUD operations, authentication, and MVC architecture patterns.

### 📋 Wireframe & Design
- **Wireframe Documentation**: [View Wireframe](https://docs.google.com/document/d/1QBZTRSbJG-Ua9X5c4dpJdOj92AUkLNowKYgllVb4d2o/edit?tab=t.0#heading=h.ywd8tfo28l0j)

---

### Key Features

- **User Authentication** — Secure JWT-based login/signup system
- **Instagram-like UI/UX** — Modern, responsive design with smooth animations
- **Photo Sharing** — Upload, process, and display images with captions
- **Comment System** — Add comments to posts with user interactions
- **User Profiles** — Customizable profiles with bio and profile pictures
- **REST API Design** — Demonstrates proper HTTP methods and status codes
- **Direct Messages** — Inbox, sent, conversations, mark as read
- **Tags & Hashtags** — Browse posts by tag

---

## 🛠️ Technology Stack

### Backend Technologies

| Technology | Description |
|------------|-------------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | Web application framework |
| **MongoDB** | NoSQL database with Mongoose ODM |
| **JWT** | JSON Web Tokens for authentication |
| **bcrypt** | Password hashing and security |
| **Multer** | File upload handling |
| **Sharp** | Image processing |

### Frontend Technologies

| Technology | Description |
|------------|-------------|
| **JSX View Engine** | Server-side rendering with JSX syntax |
| **CSS3** | Modern styling with animations and transitions |
| **Font Awesome** | Icon library for UI elements |
| **Google Fonts** | Custom typography |

### Development Tools

| Technology | Description |
|------------|-------------|
| **Nodemon** | Auto-restart of the server during development |
| **Morgan** | HTTP request logger |
| **Method Override** | PUT/DELETE support in forms |
| **dotenv** | Environment variables management |

---

## 📁 Project Structure

```
COMP3011-API-project/
├── server.js              # Entry point
├── app.js                 # Express app configuration
├── package.json
├── .env.example
├── controllers/           # Route handlers (MVC)
│   ├── auth/              # Signup, login, profile
│   ├── posts/             # Posts CRUD, view logic
│   ├── comments/
│   ├── tags/
│   └── messages/
├── models/                # Mongoose schemas
│   ├── author.js
│   ├── post.js
│   ├── comment.js
│   ├── message.js
│   └── db.js              # MongoDB connection
├── routes/
│   ├── apiRoutes.js       # Main API routes (/api/*)
│   ├── tagRoutes.js
│   ├── commentRoutes.js
│   └── messageRoutes.js
├── middleware/
│   ├── auth.js            # JWT authentication
│   └── upload.js          # Multer image upload
├── views/                 # JSX server-side templates
│   ├── layouts/
│   ├── auth/
│   ├── authors/
│   ├── posts/
│   ├── messages/
│   └── utils/
├── public/                # Static assets
│   ├── styles.css
│   ├── images/
│   ├── passToggle.js
│   ├── flashMessages.js
│   └── commentFunctionality.js
├── data/                  # Seed data
│   ├── profile-images.js
│   ├── post-images.js
│   └── instagram-influencers.csv
├── scripts/
│   ├── seed.js            # Database seeding
│   ├── filter-and-import-kaggle.js
│   └── add-postman-tests.js
├── docs/
│   ├── API-DOCUMENTATION.md
│   ├── API-DOCUMENTATION.pdf    # For coursework submission
│   ├── FlickGallery-API.postman_collection.json
│   └── POSTMAN_GUIDE.md
└── coursework-docs/       # Assignment brief
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** (for version control)

### 1. Clone the Repository

```bash
git clone https://github.com/aliaburashid/COMP3011-API-project.git
cd COMP3011-API-project
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:

**Production Dependencies:**

- `bcrypt` — Password hashing
- `dotenv` — Environment variables
- `express` — Web framework
- `jsonwebtoken` — JWT authentication
- `jsx-view-engine` — JSX rendering
- `method-override` — PUT/DELETE support
- `mongoose` — MongoDB ODM
- `morgan` — HTTP logging
- `multer` — File uploads
- `sharp` — Image processing

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
MONGO_URI=mongodb://localhost:27017/flickgallery
JWT_SECRET=your-secret-key-here
PORT=3000
```

### 4. Seed the Database

```bash
npm run seed
```

This populates the database with influencers from the Kaggle Instagram dataset, posts, and comments.

### 5. Start the Server

```bash
npm run dev     # development (nodemon)
npm start       # production
```

- **Web app:** [http://localhost:3000/authors](http://localhost:3000/authors) (login, feed, profiles)

---

## API Endpoints

**Base URL:** `http://localhost:3000/api`

View this PDF for full API documentation with endpoints, parameters, response formats, and status codes:

- **[API-DOCUMENTATION.pdf](docs/API-DOCUMENTATION.pdf)** — Complete API reference (PDF)
- **Postman collection:** [docs/FlickGallery-API.postman_collection.json](docs/FlickGallery-API.postman_collection.json) — Import into Postman for testing

### 1. Auth

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| POST | `/auth/signup` | No | 201 | Create account. Body: `{ name, email, password }` |
| | | | 400 | Validation error, missing fields, or Email already exists |
| POST | `/auth/login` | No | 200 | Login. Body: `{ email, password }`. Returns `{ author, token }` |
| | | | 400 | Invalid login credentials |

### 2. Authors (CRUD)

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| GET | `/authors` | No | 200 | List all authors |
| GET | `/authors/profile` | Yes | 200 | Get logged-in user's profile |
| | | | 401 | Not authorized |
| GET | `/authors/saved` | Yes | 200 | Get saved/bookmarked posts |
| GET | `/authors/:id` | No | 200 | Get one author by ID |
| | | | 400 | Invalid author id |
| | | | 404 | Author not found |
| PUT | `/authors/:id` | Yes | 200 | Update author |
| | | | 401 | Not authorized |
| | | | 403 | Forbidden: you can only update your own account |
| DELETE | `/authors/:id` | Yes | 204 | Delete author |
| | | | 403 | Forbidden |
| POST | `/authors/:id/follow` | Yes | 200 | Follow an author |
| | | | 400 | You cannot follow yourself |
| POST | `/authors/:id/unfollow` | Yes | 200 | Unfollow an author |
| GET | `/authors/:id/posts` | No | 200 | Get posts by author |

### 3. Posts (CRUD)

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| GET | `/posts` | No | 200 | List posts. Query: `?page=1&limit=10` |
| GET | `/posts/:id` | No | 200 | Get one post |
| | | | 400 | Invalid post id |
| | | | 404 | Post not found |
| POST | `/posts` | Yes | 201 | Create post. Body: `{ caption, imageUrl, hashtags[] }` |
| | | | 400 | Validation error |
| | | | 401 | Not authorized |
| PUT | `/posts/:id` | Yes | 200 | Update post (own only) |
| | | | 403 | Forbidden |
| DELETE | `/posts/:id` | Yes | 204 | Delete post (own only) |
| POST | `/posts/:id/like` | Yes | 200 | Like a post |
| POST | `/posts/:id/save` | Yes | 200 | Toggle save/unsave. Returns `{ saved: true\|false }` |

### 4. Comments

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| GET | `/posts/:id/comments` | No | 200 | List comments on a post |
| | | | 400 | Invalid post id |
| | | | 404 | Post not found |
| POST | `/posts/:id/comments` | Yes | 201 | Create comment. Body: `{ content }` |
| | | | 400 | Missing content |
| | | | 401 | Not authorized |
| DELETE | `/comments/:id` | Yes | 204 | Delete comment (own only) |
| | | | 403 | Forbidden |
| POST | `/comments/:id/like` | Yes | 200 | Like a comment. Returns `{ likesCount }` |

### 5. Tags (Hashtags)

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| GET | `/tags` | No | 200 | List all tags |
| GET | `/tags/:tag` | No | 200 | Get posts by tag (e.g. `/tags/fashion`) |

### 6. Messages (DMs)

| Method | Endpoint | Auth | Status | Description |
|--------|----------|------|--------|-------------|
| POST | `/messages` | Yes | 201 | Send message. Body: `{ recipientId, content }` |
| | | | 400 | Invalid recipientId, missing content, or cannot message yourself |
| | | | 404 | Recipient not found |
| GET | `/messages/inbox` | Yes | 200 | Get received messages |
| GET | `/messages/sent` | Yes | 200 | Get sent messages |
| GET | `/messages/conversation/:userId` | Yes | 200 | Get conversation with user |
| | | | 400 | Invalid user id |
| GET | `/messages/:id` | Yes | 200 | Get one message |
| | | | 403 | Forbidden: not a participant |
| | | | 404 | Message not found |
| PUT | `/messages/:id/read` | Yes | 200 | Mark as read (recipient only) |
| | | | 403 | Forbidden: only the recipient can mark as read |
| DELETE | `/messages/:id` | Yes | 204 | Delete message (sender only) |
| | | | 403 | Forbidden: only the sender can delete |

---

## Authentication

Protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Get your token from `POST /api/auth/login` or `POST /api/auth/signup`.

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (success, empty body) |
| 400 | Bad Request (validation, invalid id, etc.) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (valid token but not allowed) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Data Sources

All data used in this project is cited below. See `data/README.md` for setup instructions.

| Source | Use | Location | Licence |
|--------|-----|----------|---------|
| [Top Instagram Influencers Dataset](https://www.kaggle.com/datasets/surajjha101/top-instagram-influencers-data-cleaned) | Author names, usernames, influence metrics | `data/instagram-influencers.csv` | Kaggle (check dataset page) |
| [Celebrity Database (332 names)](https://www.kaggle.com/datasets/mhmaslam/celebrity-database-332-names) | Profile images, post images | `data/profile-images.js`, `data/post-images.js`, `public/images/` | DbCL v1.0 (Open Data Commons) |
| [Unsplash](https://unsplash.com/) | Post images (fallback for authors without Kaggle images, e.g. NBA) | `scripts/seed.js` — `images.unsplash.com` URLs | [Unsplash Licence](https://unsplash.com/license) |
| `seed-authors.json` | Fallback sample authors when CSV is missing | `data/seed-authors.json` | Built-in (project) |
| `default-avatar.png` | Placeholder for users without profile pictures | `public/images/default-avatar.png` | Project asset |
