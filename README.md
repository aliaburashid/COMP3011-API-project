# Influencer Marketing Intelligence API

A RESTful API built with **Node.js**, **Express**, and **MongoDB Atlas** for COMP3011 Web Services coursework. It models an influencer marketing platform with full CRUD for influencers, posts, brands, and sponsorships — plus seven analytics endpoints for marketing intelligence insights.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB Atlas (Mongoose ODM) |
| Authentication | JWT (`jsonwebtoken`) + bcrypt |
| Dataset | Kaggle — Top Instagram Influencers |

---

## Project Structure

```
├── app.js                          # Express app — middleware and route mounting
├── server.js                       # Entry point — DB connection and server start
├── models/
│   ├── author.js                   # Influencer schema (followerCount, engagementRate, category)
│   ├── post.js                     # Post schema (caption, imageUrl, likesCount, hashtags)
│   ├── brand.js                    # Brand schema (name, industry, country)
│   └── sponsorship.js              # Sponsorship schema (author ↔ brand deal)
├── controllers/
│   ├── auth/apiController.js       # Signup, login, profile, follow/unfollow
│   ├── posts/apiController.js      # Post CRUD + like endpoint
│   ├── brands/apiController.js     # Brand CRUD
│   ├── sponsorships/apiController.js # Sponsorship CRUD
│   └── analytics/apiController.js  # 7 analytics endpoints
├── middleware/
│   └── auth.js                     # JWT auth middleware for protected routes
├── routes/
│   ├── apiRoutes.js                # Author and post routes
│   ├── brandRoutes.js              # Brand routes
│   ├── sponsorshipRoutes.js        # Sponsorship routes
│   └── analyticsRoutes.js          # Analytics routes
├── scripts/
│   └── seed.js                     # Database seeder (authors, posts, brands, sponsorships)
└── data/
    ├── instagram-influencers.csv   # Kaggle dataset (Top Instagram Influencers)
    └── seed-authors.json           # Fallback author seed data
```

---

## Setup

### Prerequisites
- Node.js v18+
- A MongoDB Atlas account (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/aliaburashid/COMP3011-API-project.git
cd COMP3011-API-project
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/comp3011-api
JWT_SECRET=your_jwt_secret_here
```

### 3. Seed the database

```bash
npm run seed
```

This will populate the database with:
- ~200 influencers from the Kaggle Instagram dataset
- ~600 posts using Unsplash image URLs
- 20 brands (based on Forbes Global 2000 companies)
- ~88 sponsorship deals linking influencers and brands

### 4. Start the server

```bash
npm run dev     # development (nodemon)
npm start       # production
```

The API will be available at `http://localhost:3000`.

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Register a new influencer |
| POST | `/api/auth/login` | No | Login and receive JWT token |
| GET | `/api/auth/profile` | Yes | Get logged-in user's profile |

### Authors (Influencers)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/authors` | No | List all influencers |
| GET | `/api/authors/:id` | No | Get a single influencer |
| PUT | `/api/authors/:id` | Yes (owner) | Update your profile |
| DELETE | `/api/authors/:id` | Yes (owner) | Delete your account |
| POST | `/api/authors/:id/follow` | Yes | Follow an influencer |
| POST | `/api/authors/:id/unfollow` | Yes | Unfollow an influencer |

### Posts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/posts` | Yes | Create a post |
| GET | `/api/posts` | No | List all posts |
| GET | `/api/posts/:id` | No | Get a single post |
| PUT | `/api/posts/:id` | Yes (owner) | Update your post |
| DELETE | `/api/posts/:id` | Yes (owner) | Delete your post |
| POST | `/api/posts/:id/like` | Yes | Like a post |
| GET | `/api/authors/:id/posts` | No | List posts by author |

### Brands
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/brands` | Yes | Create a brand |
| GET | `/api/brands` | No | List all brands |
| GET | `/api/brands/:id` | No | Get a single brand |
| PUT | `/api/brands/:id` | Yes | Update a brand |
| DELETE | `/api/brands/:id` | Yes | Delete a brand |

### Sponsorships
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/sponsorships` | Yes | Create a sponsorship deal |
| GET | `/api/sponsorships` | No | List all sponsorships |
| GET | `/api/sponsorships/:id` | No | Get a single sponsorship |
| PUT | `/api/sponsorships/:id` | Yes | Update a sponsorship |
| DELETE | `/api/sponsorships/:id` | Yes | Delete a sponsorship |

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/top-influencers` | No | Top 10 influencers by follower count |
| GET | `/api/analytics/most-liked-posts` | No | Top 10 most liked posts |
| GET | `/api/analytics/most-active-authors` | No | Top 10 authors by post count |
| GET | `/api/analytics/category-stats` | No | Influencer stats grouped by category |
| GET | `/api/analytics/top-brands` | No | Top 10 brands by number of sponsorships |
| GET | `/api/analytics/top-sponsored-influencers` | No | Top 10 influencers by deal value |
| GET | `/api/analytics/high-value-campaigns` | No | Top 10 highest value sponsorship deals |

---

## Authentication

Protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Get your token from `POST /api/auth/login` or `POST /api/auth/signup`.

---

## MCP Server (Model Context Protocol)

The API is exposed as an **MCP server** so AI assistants (Cursor, Claude Desktop, etc.) can query FlickGallery directly.

### Prerequisites

1. **FlickGallery must be running** – start with `npm start` or `npm run dev`
2. **MCP-capable client** – Cursor, Claude Desktop, or similar

### Run the MCP server

```bash
npm run mcp
```

This starts the MCP server (stdio transport). It runs until you stop it. For Cursor/Claude, you typically add it as an MCP server in settings rather than running it manually in a terminal.

### Configure in Cursor

1. Open **Cursor Settings** → **MCP** (or **Features** → **MCP**)
2. Add a new server with:

| Field | Value |
|-------|-------|
| Name | `flickgallery` |
| Command | `node` |
| Args | `["/absolute/path/to/COMP3011-API-project/mcp-server/index.mjs"]` |
| Env (optional) | `FLICK_API_URL=http://localhost:3000` |

Use the full path to your project. If FlickGallery runs on a different port, set `FLICK_API_URL`.

### Available tools

| Tool | Description |
|------|--------------|
| `flick_list_posts` | List recent posts (supports `page`, `limit`) |
| `flick_get_post` | Get a single post by ID |
| `flick_list_authors` | List all authors |
| `flick_get_author` | Get an author by ID |
| `flick_get_author_posts` | List posts by author |
| `flick_list_tags` | List all hashtags |
| `flick_get_tag_posts` | Get posts by hashtag |

After configuration, you can ask the AI things like: *"List the latest posts from FlickGallery"* or *"Get all posts by author X"*.

---

## Data Sources

- **Influencers**: [Top Instagram Influencers Dataset](https://www.kaggle.com/datasets/surajjha101/top-instagram-influencers-data) — Kaggle (CC0 Public Domain)
- **Post images**: Hardcoded Unsplash URLs (free to use under Unsplash licence)
- **Brands**: Hardcoded based on Forbes Global 2000 public company data

---

## MCP Server (Model Context Protocol)

FlickGallery exposes an MCP server so AI assistants (Cursor, Claude Desktop, etc.) can query your API directly.

### Prerequisites
1. **Start the FlickGallery app** (`npm start` or `npm run dev`)
2. The API must be running at `http://localhost:3000` (or set `FLICK_API_URL`)

### Running the MCP server

```bash
npm run mcp
```

Or directly:

```bash
node mcp-server/index.mjs
```

### Configuring Cursor

1. Open **Cursor Settings** → **MCP** → **Add new MCP server**
2. Add a server with:
   - **Name**: `flickgallery`
   - **Command**: `node`
   - **Args**: `["mcp-server/index.mjs"]` (use the full path to your project if needed, e.g. `/Users/you/path-to-project/mcp-server/index.mjs`)

Or add to your MCP config (e.g. `~/.cursor/mcp.json` or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "flickgallery": {
      "command": "node",
      "args": ["/absolute/path/to/COMP3011-API-project/mcp-server/index.mjs"],
      "env": {
        "FLICK_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Available tools

| Tool | Description |
|------|-------------|
| `flick_list_posts` | List recent posts (supports page, limit) |
| `flick_get_post` | Get a single post by ID |
| `flick_list_authors` | List all authors |
| `flick_get_author` | Get a single author by ID |
| `flick_get_author_posts` | Get posts by a specific author |
| `flick_list_tags` | List all hashtags |
| `flick_get_tag_posts` | Get posts with a specific hashtag |

---

## HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request (validation error or malformed ID) |
| 401 | Unauthorised (missing or invalid token) |
| 403 | Forbidden (authenticated but not owner) |
| 404 | Not Found |
| 500 | Internal Server Error |
