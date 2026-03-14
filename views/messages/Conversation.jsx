const React = require('react')
const Layout = require('../layouts/Layout')
const { getAvatarUrl } = require('../utils/avatar')

function Conversation({ messages, otherUser, otherUserId, currentUserId, token }) {
  return (
    <Layout token={token}>
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #dbdbdb',
        }}>
          <a href="/messages" style={{ color: '#262626', textDecoration: 'none', fontSize: '1.2rem' }}>
            <i className="fas fa-arrow-left"></i>
          </a>
          <a href={`/authors/${otherUserId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', flex: 1 }}>
            <img
              src={getAvatarUrl(otherUser)}
              alt={otherUser.name}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <span style={{ fontWeight: '600', fontSize: '1rem' }}>{otherUser.name}</span>
          </a>
        </div>

        {/* Messages thread */}
        <div style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8e8e8e', padding: '2rem 0' }}>
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((m) => {
              const senderId = m.sender && (m.sender._id ? m.sender._id.toString() : m.sender.toString())
              const isMe = senderId === currentUserId
              return (
                <div
                  key={m._id}
                  style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '0.6rem 1rem',
                      borderRadius: '18px',
                      background: isMe ? '#0095f6' : '#efefef',
                      color: isMe ? 'white' : '#262626',
                      fontSize: '0.95rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>{m.content}</span>
                    {isMe && (
                      <form action={`/messages/${m._id}/delete`} method="POST" style={{ margin: 0, display: 'inline', marginLeft: '0.5rem' }} data-delete-confirm>
                        <button
                          type="submit"
                          title="Delete message"
                          style={{
                            background: 'rgba(0,0,0,0.2)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            fontSize: '0.85rem',
                            borderRadius: '6px',
                          }}
                        >
                          <i className="far fa-trash-alt"></i>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Send form */}
        <form action="/messages" method="POST" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #dbdbdb' }}>
          <input type="hidden" name="recipientId" value={otherUserId} />
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              name="content"
              placeholder="Message..."
              required
              maxLength={1000}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                border: '1px solid #dbdbdb',
                borderRadius: '22px',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.65rem 1.2rem',
                background: '#0095f6',
                color: 'white',
                border: 'none',
                borderRadius: '22px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
      <script dangerouslySetInnerHTML={{
        __html: `document.querySelectorAll('form[data-delete-confirm]').forEach(function(f){f.onsubmit=function(){return confirm('Delete this message?');};});`
      }} />
    </Layout>
  )
}

module.exports = Conversation
