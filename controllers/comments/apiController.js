/**
 * Comment API controller – CRUD for comments on posts.
 *
 * Endpoints:
 *   POST   /api/posts/:id/comments      → createComment  (auth required)
 *   GET    /api/posts/:id/comments      → listComments   (public)
 *   DELETE /api/comments/:id            → deleteComment  (auth + owner)
 *   POST   /api/comments/:id/like       → likeComment    (auth required)
 */
const mongoose = require('mongoose')
const Comment = require('../../models/comment')
const Post = require('../../models/post')

/**
 * POST /api/posts/:id/comments
 * Add a comment to a post.
 * Body: content (required)
 * Returns 201 with { comment }; 400 for bad post id or missing content; 404 if post not found.
 */
exports.createComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' })
    }
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const comment = new Comment({
      post: post._id,
      author: req.user._id,
      content: req.body.content,
    })
    await comment.save()

    // Push the comment id into the post's comments array
    post.comments.push(comment._id)
    await post.save()

    // Return comment with author details populated
    await comment.populate('author', 'name profilePicture')

    res.status(201).json({ comment })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

/**
 * GET /api/posts/:id/comments
 * List all comments on a post, oldest first.
 * Public – no auth required.
 * Returns 200 with { comments, count }; 400 for bad id; 404 if post not found.
 */
exports.listComments = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post id' })
    }
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })

    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'name profilePicture')

    res.status(200).json({ comments, count: comments.length })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * DELETE /api/comments/:id
 * Delete a comment – only the comment author can delete it.
 * Also removes the comment _id from the Post's comments array.
 * Returns 204; 400 for bad id; 403 if not owner; 404 if not found.
 */
exports.deleteComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid comment id' })
    }
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: you can only delete your own comments' })
    }

    await comment.deleteOne()

    // Remove from post's comments array
    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * POST /api/comments/:id/like
 * Like a comment – increments likesCount by 1.
 * Auth required.
 * Returns 200 with { likesCount }; 400 for bad id; 404 if not found.
 */
exports.likeComment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid comment id' })
    }
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $inc: { likesCount: 1 } },
      { new: true }
    )
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    res.status(200).json({ likesCount: comment.likesCount })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
