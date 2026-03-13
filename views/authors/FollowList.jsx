const React = require('react')
const Layout = require('../layouts/Layout')
const { getAvatarUrl } = require('../utils/avatar')

function FollowList({ users, title, token, backUrl }) {
  return (
    <Layout token={token}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #dbdbdb',
        }}>
          <a href={backUrl} style={{ color: '#262626', textDecoration: 'none', fontSize: '1.2rem' }}>
            <i className="fas fa-arrow-left"></i>
          </a>
          <h2 style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>{title}</h2>
          <span style={{ color: '#8e8e8e', fontSize: '0.9rem' }}>({users.length})</span>
        </div>

        {/* User list */}
        {users.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#8e8e8e', padding: '2rem 0' }}>
            Nobody here yet
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {users.map((user) => (
              <li key={user._id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                padding: '0.65rem 0',
                borderBottom: '1px solid #f0f0f0',
              }}>
                <a href={`/authors/${user._id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <img
                    src={getAvatarUrl(user)}
                    alt={user.name}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid #dbdbdb',
                    }}
                  />
                </a>
                <a href={`/authors/${user._id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user.name}</div>
                  {user.bio && (
                    <div style={{ color: '#8e8e8e', fontSize: '0.82rem', marginTop: '0.1rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                      {user.bio}
                    </div>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}

module.exports = FollowList
