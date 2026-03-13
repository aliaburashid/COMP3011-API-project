const RESOURCE_PATH = '/posts'

const viewController = {

  // Show the feed (home page after login)
  index(req, res) {
    res.render('posts/Feed', res.locals.data)
  },

  // Show the upload a new post form
  newView(req, res) {
    res.render('posts/NewPost', { token: res.locals.data.token })
  },

  // Stay on the same page (after adding/deleting a comment)
  stayOnPage(req, res) {
    const ref = req.get('referer') || '/posts'
    const url = new URL(ref, 'http://localhost')
    url.searchParams.delete('token')
    res.redirect(url.pathname + url.search + url.hash)
  },

  // Redirect back to the same page, anchored to the specific post (after like/save)
  stayOnPost(req, res) {
    const referer = req.get('referer') || '/posts'
    const postId = req.params.id
    const url = new URL(referer, 'http://localhost')
    url.searchParams.delete('token')
    const base = url.pathname + url.search
    res.redirect(`${base}#post-${postId}`)
  },

  // Show a single post
  show(req, res) {
    res.render('posts/ShowPost', {
      post: res.locals.data.post,
      token: res.locals.data.token,
      currentUserId: res.locals.data.currentUserId,
      savedPostIds: res.locals.data.savedPostIds || [],
    })
  },

  // Redirect to feed after creating a post
  redirectShow(req, res) {
    res.redirect(RESOURCE_PATH)
  },

  // Redirect to profile after deleting a post
  redirectToProfile(req, res) {
    res.redirect('/authors/profile')
  },

  // Hashtag feed page
  hashtagFeed(req, res) {
    res.render('posts/HashtagFeed', {
      tag: res.locals.data.tag,
      posts: res.locals.data.posts,
      token: res.locals.data.token,
    })
  },

  // Saved posts page
  savedFeed(req, res) {
    res.render('posts/Saved', {
      posts: res.locals.data.posts,
      token: res.locals.data.token,
    })
  },

  // Redirect to feed after login (cookie already set)
  redirectHome(req, res) {
    res.redirect(RESOURCE_PATH)
  },
}

module.exports = viewController
