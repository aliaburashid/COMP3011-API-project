const React = require('react')
const Layout = require('../layouts/Layout')
const { getAvatarUrl } = require('../utils/avatar')

function formatCount(n) {
  if (!n || n === 0) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

function Explore({ authors, token, query }) {
  return (
    <Layout token={token}>
      {/* Search bar */}
      <div style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
        <h2 style={{ fontWeight: '600', marginBottom: '1rem' }}>Explore People</h2>
        <form action="/explore" method="GET" style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            name="q"
            defaultValue={query || ''}
            placeholder="Search by name or category..."
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              border: '1px solid #dbdbdb',
              borderRadius: '8px',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.6rem 1.2rem',
              background: '#0095f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Results count */}
      <p style={{ color: '#8e8e8e', fontSize: '0.85rem', maxWidth: '600px', margin: '0 auto 1rem' }}>
        {authors.length} {authors.length === 1 ? 'profile' : 'profiles'} found
      </p>

      {/* User grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        {authors.map((author) => (
          <a
            key={author._id}
            href={`/authors/${author._id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              background: 'white',
              border: '1px solid #dbdbdb',
              borderRadius: '12px',
              padding: '1.2rem',
              transition: 'box-shadow 0.2s',
            }}>
              {/* Username + profile image at top */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}>
                <img
                  src={getAvatarUrl(author)}
                  alt={author.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #dbdbdb',
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontWeight: '600', fontSize: '0.95rem', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {author.name}
                </div>
              </div>
              {author.category && author.category !== 'general' && (
                <div style={{ color: '#8e8e8e', fontSize: '0.8rem', marginBottom: '0.4rem', textAlign: 'left' }}>
                  {author.category}
                </div>
              )}
              <div style={{ color: '#8e8e8e', fontSize: '0.8rem', textAlign: 'left' }}>
                {author.followerCount > 0
                  ? formatCount(author.followerCount)
                  : author.followers ? author.followers.length : 0} followers
              </div>
            </div>
          </a>
        ))}
      </div>

      {authors.length === 0 && (
        <p style={{ textAlign: 'center', color: '#8e8e8e', marginTop: '3rem' }}>
          No profiles found for "{query}"
        </p>
      )}
    </Layout>
  )
}

module.exports = Explore
