const viewController = {

  // Renders the Sign Up form (GET /authors)
  signUp(req, res) {
    res.render('auth/SignUp')
  },

  // Renders the Sign In form (GET /authors/login)
  signIn(req, res) {
    res.render('auth/SignIn')
  },

  // Redirect to login page after successful signup
  redirectToLogin(req, res) {
    res.redirect('/authors/login')
  },

  // Show the profile page
  showProfile(req, res) {
    res.render('posts/Profile', {
      ...res.locals.data,
      tab: res.locals.data.tab || 'posts',
    })
  },

  // Redirect to profile after edit (cookie sent automatically)
  redirectToProfile(req, res) {
    res.redirect('/authors/profile')
  },

  // Render followers or following list
  showFollowList(req, res) {
    res.render('authors/FollowList', {
      users: res.locals.data.users,
      title: res.locals.data.title,
      token: res.locals.data.token,
      backUrl: '/authors/profile',
    })
  },

  // Render the Explore / search page
  explore(req, res) {
    res.render('authors/Explore', {
      ...res.locals.data,
      token: res.locals.data.token,
    })
  },

  // Render another user's public profile
  showAuthorProfile(req, res) {
    res.render('authors/AuthorProfile', {
      ...res.locals.data,
      currentUser: res.locals.data.currentUser,
      token: res.locals.data.token,
    })
  },

  // After follow/unfollow, go back to that author's profile
  redirectToAuthorProfile(req, res) {
    res.redirect(`/authors/${req.params.id}`)
  },
}

module.exports = viewController
