# FlickGallery — Deployment Guide

This guide walks you through deploying FlickGallery to **Render** (free tier) with **MongoDB Atlas**.

---

## Prerequisites

- GitHub repository with your code pushed
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier)
- [Render](https://render.com) account (free tier)

---

## 1. MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign in.
2. Create a **free M0 cluster** (if you don't have one).
3. **Database Access** → Add user → set username/password → save.
4. **Network Access** → Add IP → allow `0.0.0.0/0` (allows Render to connect).
5. **Connect** → Drivers → copy your connection string:
  ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/comp3011-api?retryWrites=true&w=majority
  ```

---

## 2. Deploy to Render

### Option A: Dashboard (manual)

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect your GitHub repo (`aliaburashid/COMP3011-API-project`).
3. Configure:

  | Setting           | Value         |
  | ----------------- | ------------- |
  | **Name**          | flickgallery  |
  | **Environment**   | Node          |
  | **Build Command** | `npm install` |
  | **Start Command** | `npm start`   |
  | **Instance Type** | Free          |

4. **Environment Variables** — add:

  | Key          | Value                                              |
  | ------------ | -------------------------------------------------- |
  | `MONGO_URI`  | Your MongoDB Atlas connection string               |
  | `JWT_SECRET` | A long random string (e.g. `openssl rand -hex 32`) |
  | `NODE_ENV`   | `production`                                       |

5. Click **Create Web Service**.

### Option B: Blueprint (`render.yaml`)

If your repo includes `render.yaml` in the root:

1. **New** → **Blueprint**.
2. Connect the repo — Render will read the config.
3. Add environment variables in the dashboard (they are not in the YAML for security).

---

## 3. Post-deploy

- Render assigns a URL like `https://flickgallery-xxxx.onrender.com`.
- **Web app:** `https://your-app.onrender.com/authors`
- **API base:** `https://your-app.onrender.com/api`

### Seed the database

The deployed app uses your MongoDB Atlas database. Seed it from your **local machine**:

```bash
MONGO_URI="your-atlas-connection-string" npm run seed
```

Use the same `MONGO_URI` as in Render. This populates the remote database with authors, posts, and comments.

---

## 4. Update Postman

Change the `baseUrl` in your Postman collection to your live URL:

```
https://your-app.onrender.com/api
```

---

## 5. Limitations (free tier)


| Item             | Note                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cold starts**  | Free instances spin down after ~15 min of inactivity. First request may take 30–60 s.                                                                     |
| **File uploads** | Uploads go to ephemeral disk. They are lost when the service restarts. For coursework this is acceptable; for production use cloud storage (e.g. AWS S3). |
| **Build time**   | Free tier has limits; keep `node_modules` out of git.                                                                                                     |


---

## 6. Troubleshooting


| Issue                        | Fix                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| "MongoServerError: bad auth" | Check username/password in `MONGO_URI` and that the DB user has read/write access. |
| "Could not connect"          | Ensure MongoDB Network Access allows `0.0.0.0/0` (or add Render IPs).              |
| 502 Bad Gateway              | Check Render logs for errors; confirm `npm start` runs without crashing.           |
| Slow first load              | Normal on free tier due to cold starts.                                            |


---

## 7. Add to README

After deploying, add your live URL to the main README, e.g.:

```markdown
**Live demo:** [https://flickgallery-xxxx.onrender.com/authors](https://flickgallery-xxxx.onrender.com/authors)
```

