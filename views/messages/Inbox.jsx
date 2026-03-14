const React = require('react')
const Layout = require('../layouts/Layout')
const { getAvatarUrl } = require('../utils/avatar')

function Inbox({ conversations, unreadTotal, token }) {
  return (
    <Layout token={token}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #dbdbdb',
        }}>
          <a href="/posts" style={{ color: '#262626', textDecoration: 'none', fontSize: '1.2rem' }}>
            <i className="fas fa-arrow-left"></i>
          </a>
          <h2 style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>Messages</h2>
          {unreadTotal > 0 && (
            <span style={{
              background: '#ed4956',
              color: 'white',
              borderRadius: '10px',
              padding: '0.15rem 0.5rem',
              fontSize: '0.8rem',
              fontWeight: '600',
            }}>
              {unreadTotal}
            </span>
          )}
        </div>

        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#8e8e8e' }}>
            <i className="far fa-comments" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
            <p style={{ margin: 0, fontWeight: '600', fontSize: '1.05rem' }}>No messages yet</p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
              Visit someone&apos;s profile and tap <strong>Message</strong> to start a conversation.
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {conversations.map((conv) => (
              <li key={conv.otherUser._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <a
                  href={`/messages/${conv.otherUser._id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 0',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <img
                    src={getAvatarUrl(conv.otherUser)}
                    alt={conv.otherUser.name}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: conv.unreadCount > 0 ? '600' : '500', fontSize: '0.95rem' }}>
                        {conv.otherUser.name}
                      </span>
                      {conv.latestMessage.createdAt && (
                        <span style={{ color: '#8e8e8e', fontSize: '0.8rem', flexShrink: 0 }}>
                          {new Date(conv.latestMessage.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div style={{
                      color: '#8e8e8e',
                      fontSize: '0.9rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}>
                      {conv.unreadCount > 0 && (
                        <span style={{
                          background: '#0095f6',
                          color: 'white',
                          borderRadius: '50%',
                          width: '8px',
                          height: '8px',
                          flexShrink: 0,
                        }}></span>
                      )}
                      {conv.latestMessage.content}
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}

module.exports = Inbox
