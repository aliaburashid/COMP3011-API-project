/**
 * Post API controller – full CRUD for influencer posts.
 * All responses are JSON. Auth middleware must run before protected routes.
 *
 * Endpoints handled:
 *   POST   /api/posts                   → createPost   (auth required)
 *   GET    /api/posts                   → indexPosts   (public)
 *   GET    /api/posts/:id               → showPost     (public)
 *   PUT    /api/posts/:id               → updatePost   (auth + ownership)
 *   DELETE /api/posts/:id               → deletePost   (auth + ownership)
 *   GET    /api/authors/:id/posts       → listByAuthor (public)
 */
const mongoose = require('mongoose')
const Post = require('../../models/post')
const Author = require('../../models/author')

/**
 * POST /api/posts
 * Create a new post for the logged-in author.
 * Body: caption (required), imageUrl (optional), hashtags (optional array).
 * likesCount always starts at 0 — users cannot set it directly.
 * Returns 201 with { post }; 400 on validation error.
 */
exports.createPost = async (req, res) => {
  try {
    const post = new Post({
      // Link post to the currently authenticated author
      author: req.user._id,
      caption: req.body.caption,
      imageUrl: req.body.imageUrl || '',
      // likesCount always starts at 0 – users cannot manually set likes
      likesCount: 0,
      // Validate that hashtags is an array before using it
      hashtags: Array.isArray(req.body.hashtags) ? req.body.hashtags : [],
    })

    await post.save()

    // Push the new post _id into the Author's posts array (one-to-many relationship)
    await Author.findByIdAndUpdate(req.user._id, { $push: { posts: post._id } })

    res.status(201).json({ post })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * GET /api/posts?page=1&limit=10
 * List posts, newest first. Supports pagination via query params.
 * Public – no auth required.
 * Returns 200 with { posts, total, page, pages }.
 */
exports.indexPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      Post.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name profilePicture'),
      Post.countDocuments(),
    ])

    res.status(200).json({ posts, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/posts/:id
 * Get a single post by its MongoDB _id. Populates full author profile.
 * Public – no auth required.
 * Returns 200 with { post }; 400 if id is malformed; 404 if not found.
 */
exports.showPost = async (req, res) => {
  try {
    // Return 400 for malformed ids (e.g. /api/posts/abc) before hitting the DB
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' })
    }

    const post = await Post.findById(req.params.id)
      .populate('author', 'name profilePicture bio location')

    if (!post) return res.status(404).json({ message: 'Post not found' })

    res.status(200).json({ post })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * PUT /api/posts/:id
 * Update a post – only the author who created it can update it.
 * Allowed fields: caption, imageUrl, hashtags.
 * likesCount is NOT updatable here – use POST /api/posts/:id/like instead.
 * Returns 200 with { post }; 400 for bad id/validation; 403 if not owner; 404 if not found.
 */
exports.updatePost = async (req, res) => {
  try {
    // Reject malformed ids immediately
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' })
    }

    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    // Only the post's author can update it
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: you can only update your own posts' })
    }

    // likesCount is intentionally excluded – it should only change via a dedicated like endpoint
    const allowed = ['caption', 'imageUrl', 'hashtags']
    allowed.forEach((key) => {
      if (key === 'hashtags') {
        // Ensure hashtags is always stored as an array
        if (req.body.hashtags !== undefined) {
          post.hashtags = Array.isArray(req.body.hashtags) ? req.body.hashtags : []
        }
      } else if (req.body[key] !== undefined) {
        post[key] = req.body[key]
      }
    })

    await post.save()

    res.status(200).json({ post })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * DELETE /api/posts/:id
 * Delete a post – only the author who created it can delete it.
 * Also removes the post _id from the Author's posts array.
 * Returns 204 no content; 400 for bad id; 403 if not owner; 404 if not found.
 */
exports.deletePost = async (req, res) => {
  try {
    // Reject malformed ids immediately
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' })
    }

    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    // Only the post's author can delete it
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: you can only delete your own posts' })
    }

    await post.deleteOne()

    // Remove the post _id from the Author's posts array to keep the relationship clean
    await Author.findByIdAndUpdate(req.user._id, { $pull: { posts: post._id } })

    // 204 No Content – REST convention for a successful delete
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/authors/:id/posts
 * List all posts by a specific author. Populates author name and avatar for consistency.
 * Public – no auth required.
 * Returns 200 with { posts: [...] }; 400 for bad id; 404 if author not found.
 */
exports.listByAuthor = async (req, res) => {
  try {
    // Reject malformed author ids before hitting the DB
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid author id' })
    }

    const author = await Author.findById(req.params.id)
    if (!author) return res.status(404).json({ message: 'Author not found' })

    const posts = await Post.find({ author: req.params.id })
      .sort({ createdAt: -1 })
      .populate('author', 'name profilePicture')

    res.status(200).json({ posts })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * POST /api/posts/:id/like
 * Toggle like on a post. Adds user to likedBy (and increments likesCount) if not
 * already liked; removes and decrements if already liked.
 * Returns 200 with { likesCount, liked: true|false }.
 */
exports.likePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' })
    }

    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const userId = req.user._id
    const alreadyLiked = post.likedBy.some(id => id.toString() === userId.toString())

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      alreadyLiked
        ? { $pull: { likedBy: userId }, $inc: { likesCount: -1 } }
        : { $addToSet: { likedBy: userId }, $inc: { likesCount: 1 } },
      { new: true }
    )

    res.status(200).json({ likesCount: updated.likesCount, liked: !alreadyLiked })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * POST /api/posts/:id/save
 * Toggle bookmark. Returns { saved: true|false }.
 */
exports.savePost = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' })
    }
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const userId = req.user._id
    const author = await Author.findById(userId)
    const alreadySaved = author.savedPosts.some(id => id.toString() === req.params.id)

    await Author.findByIdAndUpdate(
      userId,
      alreadySaved
        ? { $pull: { savedPosts: req.params.id } }
        : { $addToSet: { savedPosts: req.params.id } }
    )
    res.status(200).json({ saved: !alreadySaved })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/authors/saved
 * Get all bookmarked posts for the logged-in user.
 */
exports.getSaved = async (req, res) => {
  try {
    const author = await Author.findById(req.user._id)
      .populate({ path: 'savedPosts', populate: { path: 'author', select: 'name profilePicture' } })
    res.status(200).json({ posts: author.savedPosts.reverse() })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
