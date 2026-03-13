const React = require('react')
const Layout = require('../layouts/Layout')

function HashtagFeed({ tag, posts, token }) {
  return (
    <Layout token={token}>
      <div style={{ maxWidth: '935px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid #dbdbdb',
        }}>
          <div style={{
            width: '77px', height: '77px', borderRadius: '50%',
            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', color: 'white', fontWeight: '700', flexShrink: 0,
          }}>
            #
          </div>
          <div>
            <h1 style={{ margin: '0 0 0.3rem', fontWeight: '600', fontSize: '1.5rem' }}>#{tag}</h1>
            <p style={{ margin: 0, color: '#8e8e8e' }}>
              <strong style={{ color: '#262626' }}>{posts.length}</strong> posts
            </p>
          </div>
        </div>

        {/* Posts grid */}
        {posts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
            {posts.map((post) => (
              <a
                key={post._id}
                href={`/posts/${post._id}`}
                style={{ display: 'block', aspectRatio: '1', overflow: 'hidden' }}
              >
                <img
                  src={post.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                  alt={post.caption}
                  onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </a>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#8e8e8e' }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>No posts with #{tag} yet</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

module.exports = HashtagFeed
