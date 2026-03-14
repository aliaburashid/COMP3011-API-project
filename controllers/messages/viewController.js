const viewController = {
  inbox(req, res) {
    res.render('messages/Inbox', {
      conversations: res.locals.data.conversations,
      unreadTotal: res.locals.data.unreadTotal,
      token: res.locals.data.token,
    })
  },

  conversation(req, res) {
    res.render('messages/Conversation', {
      messages: res.locals.data.messages,
      otherUser: res.locals.data.otherUser,
      otherUserId: res.locals.data.otherUserId,
      currentUserId: req.author._id.toString(),
      token: res.locals.data.token,
    })
  },

  redirectToConversation(req, res) {
    res.redirect(`/messages/${req.body.recipientId}`)
  },

  redirectAfterDelete(req, res) {
    res.redirect(`/messages/${res.locals.data.redirectRecipientId}`)
  },
}

module.exports = viewController
