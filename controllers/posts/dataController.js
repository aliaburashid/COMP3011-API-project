const Post = require('../../models/post')
const Author = require('../../models/author')
const Comment = require('../../models/comment')

const dataController = {}

// Get posts for feed (following + self, newest first)
dataController.index = async (req, res, next) => {
  try {
    const currentUser = req.author
    const followingIds = [...currentUser.following, currentUser._id]

    res.locals.data.posts = await Post.find({
      author: { $in: followingIds },
      isPrivate: false,
    })
      .populate('author', 'name profilePicture')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name profilePicture' },
      })
      .sort({ createdAt: -1 })
      .limit(20)

    res.locals.data.currentUserId = currentUser._id.toString()
    // Pass saved post ids so bookmark icons render correctly
    const Author = require('../../models/author')
    const authorDoc = await Author.findById(currentUser._id).select('savedPosts')
    res.locals.data.savedPostIds = authorDoc.savedPosts.map(id => id.toString())
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// Create a new post (image upload via multer)
dataController.create = async (req, res, next) => {
  try {
    req.body.author = req.author._id
    req.body.imageUrl = req.file.path
    res.locals.data.post = await Post.create(req.body)
    req.author.posts.push(res.locals.data.post._id)
    await req.author.save()
    next()
  } catch (error) {
    res.status(400).send({ message: error.message })
  }
}

// Add a comment to a post
dataController.addComment = async (req, res, next) => {
  try {
    const { content } = req.body
    const comment = await Comment.create({
      author: req.author._id,
      post: req.params.postId,
      content,
    })
    await Post.findByIdAndUpdate(req.params.postId, { $push: { comments: comment._id } })
    next()
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
}

// Delete a comment — only the comment author can do this
dataController.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return res.status(404).send({ message: 'Comment not found' })
    if (comment.author.toString() !== req.author._id.toString()) {
      return res.status(403).send({ message: 'Forbidden: you can only delete your own comments' })
    }
    await comment.deleteOne()
    await Post.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id } })
    next()
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
}

// Show a single post with author + comments
dataController.show = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author')
      .populate({ path: 'comments', populate: { path: 'author' } })
    res.locals.data.post = post
    res.locals.data.currentUserId = req.author._id.toString()
    const AuthorModel = require('../../models/author')
    const authorDoc = await AuthorModel.findById(req.author._id).select('savedPosts')
    res.locals.data.savedPostIds = authorDoc.savedPosts.map(id => id.toString())
    next()
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
}

// Like/unlike a post — toggles based on whether user already liked it
dataController.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).send({ message: 'Post not found' })

    const userId = req.author._id
    const alreadyLiked = post.likedBy.some(id => id.toString() === userId.toString())

    if (alreadyLiked) {
      await Post.findByIdAndUpdate(req.params.id, {
        $pull: { likedBy: userId },
        $inc: { likesCount: -1 },
      })
    } else {
      await Post.findByIdAndUpdate(req.params.id, {
        $addToSet: { likedBy: userId },
        $inc: { likesCount: 1 },
      })
    }
    next()
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
}

// Hashtag feed — all posts with a given tag
dataController.hashtagFeed = async (req, res, next) => {
  try {
    const tag = req.params.tag.toLowerCase().replace(/^#/, '')
    res.locals.data.posts = await Post.find({ hashtags: tag })
      .populate('author', 'name profilePicture')
      .sort({ createdAt: -1 })
    res.locals.data.tag = tag
    next()
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
}

// Toggle save / unsave a post
dataController.toggleSave = async (req, res, next) => {
  try {
    const Author = require('../../models/author')
    const userId = req.author._id
    const postId = req.params.id
    const author = await Author.findById(userId)
    const alreadySaved = author.savedPosts.some(id => id.toString() === postId)
    if (alreadySaved) {
      await Author.findByIdAndUpdate(userId, { $pull: { savedPosts: postId } })
    } else {
      await Author.findByIdAndUpdate(userId, { $addToSet: { savedPosts: postId } })
    }
    next()
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
}

// Saved posts feed
dataController.savedFeed = async (req, res, next) => {
  try {
    const Author = require('../../models/author')
    const author = await Author.findById(req.author._id)
      .populate({ path: 'savedPosts', populate: { path: 'author', select: 'name profilePicture' } })
    res.locals.data.posts = author.savedPosts.reverse()
    next()
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
}

// Delete a post (only owner can delete)
dataController.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post || post.author.toString() !== req.author._id.toString()) {
      return res.status(403).send({ message: 'Not authorized to delete this post' })
    }
    await Post.findByIdAndDelete(req.params.id)
    await Author.findByIdAndUpdate(req.author._id, { $pull: { posts: req.params.id } })
    next()
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
}

module.exports = dataController
