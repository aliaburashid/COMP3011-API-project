const Post = require('../../models/post')

/**
 * GET /api/tags
 * Returns all unique hashtags with their post count, sorted by popularity.
 */
exports.listTags = async (req, res) => {
  try {
    const tags = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
    ])
    res.status(200).json({ tags })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/tags/:tag
 * Returns all posts that contain the given hashtag, newest first.
 */
exports.showTag = async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase().replace(/^#/, '')
    const posts = await Post.find({ hashtags: tag })
      .populate('author', 'name profilePicture')
      .sort({ createdAt: -1 })
    res.status(200).json({ tag, count: posts.length, posts })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
