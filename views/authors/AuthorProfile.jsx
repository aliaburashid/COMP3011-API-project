const React = require('react')
const Layout = require('../layouts/Layout')
const { getAvatarUrl } = require('../utils/avatar')

function formatCount(n) {
  if (!n || n === 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

function AuthorProfile({ author, currentUser, isFollowing, token }) {
  const isOwnProfile = currentUser && currentUser.toString() === author._id.toString()

  return (
    <Layout token={token}>
      {/* Page-level back bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #dbdbdb',
        maxWidth: '935px',
        margin: '0 auto 1.5rem',
      }}>
        <a
          href="/explore"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#262626',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.95rem',
          }}
        >
          <i className="fas fa-chevron-left" style={{ fontSize: '0.85rem' }}></i>
          Explore
        </a>
        <span style={{ color: '#8e8e8e', fontSize: '0.95rem' }}>/</span>
        <span style={{ color: '#262626', fontWeight: '600', fontSize: '0.95rem' }}>{author.name}</span>
      </div>

      {/* Profile container */}
      <div style={{ maxWidth: '935px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '3rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            <img
              src={getAvatarUrl(author)}
              alt={author.name}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #dbdbdb',
              }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            {/* Username row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontWeight: '300', fontSize: '1.6rem', letterSpacing: '-0.3px' }}>
                {author.name}
              </h2>

              {!isOwnProfile && (
                <>
                  <a
                    href={`/messages/${author._id}`}
                    style={{
                      padding: '0.4rem 1.2rem',
                      background: 'white',
                      color: '#262626',
                      border: '1px solid #dbdbdb',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    Message
                  </a>
                  <form
                    action={isFollowing
                      ? `/authors/${author._id}/unfollow`
                      : `/authors/${author._id}/follow`}
                    method="POST"
                    style={{ margin: 0, display: 'inline' }}
                  >
                    <button type="submit" style={{
                      padding: '0.4rem 1.2rem',
                      background: isFollowing ? 'white' : '#0095f6',
                      color: isFollowing ? '#262626' : 'white',
                      border: isFollowing ? '1px solid #dbdbdb' : 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex',
              gap: '2.5rem',
              marginBottom: '1rem',
              fontSize: '1rem',
            }}>
              <span>
                <strong style={{ fontWeight: '600' }}>{author.posts ? author.posts.length : 0}</strong>
                {' '}posts
              </span>
              <span>
                {/* followerCount = real Instagram followers from dataset */}
                <strong style={{ fontWeight: '600' }}>
                  {author.followerCount > 0
                    ? formatCount(author.followerCount)
                    : author.followers ? author.followers.length : 0}
                </strong>
                {' '}followers
              </span>
              <span>
                <strong style={{ fontWeight: '600' }}>{author.following ? author.following.length : 0}</strong>
                {' '}following
              </span>
            </div>

            {/* Bio — only show if it looks like a real user-written bio */}
            {author.bio && !author.bio.includes('followers') && !author.bio.includes('influence score') && (
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                {author.bio}
              </p>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #dbdbdb', marginBottom: '1.5rem' }}></div>

        {/* ── Posts grid ── */}
        {author.posts && author.posts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '3px',
          }}>
            {author.posts.map((post) => (
              <a
                key={post._id}
                href={`/posts/${post._id}`}
                style={{
                  display: 'block',
                  aspectRatio: '1',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <img
                  src={post.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                  alt="post"
                  onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </a>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#8e8e8e' }}>
            <i className="fas fa-camera" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
            <p style={{ margin: 0, fontWeight: '600' }}>No Posts Yet</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

module.exports = AuthorProfile
