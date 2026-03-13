const React = require('react')
const Layout = require('../layouts/Layout')

function Saved({ posts, token }) {
  return (
    <Layout token={token}>
      <div style={{ maxWidth: '935px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #dbdbdb',
        }}>
          <a href={`/authors/profile`}
             style={{ color: '#262626', textDecoration: 'none', fontSize: '1.1rem' }}>
            <i className="fas fa-chevron-left"></i>
          </a>
          <h2 style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>Saved</h2>
          <span style={{ color: '#8e8e8e', fontSize: '0.9rem' }}>({posts.length})</span>
        </div>

        {posts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
            {posts.map((post) => (
              <a
                key={post._id}
                href={`/posts/${post._id}`}
                style={{ display: 'block', aspectRatio: '1', overflow: 'hidden', position: 'relative' }}
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
            <i className="far fa-bookmark" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
            <p style={{ fontWeight: '600', margin: '0 0 0.5rem', color: '#262626' }}>Save photos and videos</p>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Save posts you want to see again by tapping the bookmark icon.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

module.exports = Saved
