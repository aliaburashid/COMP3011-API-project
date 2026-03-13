/**
 * Returns the avatar URL for a user.
 * If profilePicture exists (from Kaggle import or upload) → use it.
 * Otherwise → local default avatar.
 */
function getAvatarUrl(user) {
  if (user && user.profilePicture) return user.profilePicture
  return '/images/default-avatar.png'
}

module.exports = { getAvatarUrl }
