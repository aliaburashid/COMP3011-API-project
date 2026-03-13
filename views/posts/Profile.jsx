const React = require('react');
const Layout = require('../layouts/Layout');
const { getAvatarUrl } = require('../utils/avatar');

function Profile({ profile, token, tab }) {
    const activeTab = tab || 'posts'
    const savedPosts = (profile.savedPosts || []).slice().reverse()

    const tabStyle = (name) => ({
        padding: '0.75rem 0',
        borderTop: activeTab === name ? '1px solid #262626' : '1px solid transparent',
        color: activeTab === name ? '#262626' : '#8e8e8e',
        fontWeight: activeTab === name ? '600' : '400',
        fontSize: '0.8rem',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        cursor: 'pointer',
    })

    return (
        <Layout token={token}>
            <div className="profile-container">
                {/* Profile header */}
                <div className="profile-header">
                    <img
                        className="profile-avatar"
                        src={getAvatarUrl(profile)}
                        alt="avatar"
                    />
                    <div className="profile-info">
                        <h2>{profile.name}</h2>
                        {profile.bio && <p>{profile.bio}</p>}
                        <div className="profile-stats">
                            <span><strong>{profile.posts.length}</strong> posts</span>
                            <a href="/authors/followers" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <span><strong>{profile.followers.length}</strong> followers</span>
                            </a>
                            <a href="/authors/following" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <span><strong>{profile.following.length}</strong> following</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="edit-profile-wrapper">
                    <a href="/authors/edit" className="edit-profile-btn">
                        Edit Profile
                    </a>
                </div>

                {/* ── Tabs ── */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '3rem',
                    borderTop: '1px solid #dbdbdb',
                    marginBottom: '1px',
                }}>
                    <a href="/authors/profile?tab=posts" style={tabStyle('posts')}>
                        <i className="fas fa-th" style={{ fontSize: '0.75rem' }}></i>
                        Posts
                    </a>
                    <a href="/authors/profile?tab=saved" style={tabStyle('saved')}>
                        <i className="far fa-bookmark" style={{ fontSize: '0.75rem' }}></i>
                        Saved
                    </a>
                </div>

                {/* ── Posts grid ── */}
                {activeTab === 'posts' && (
                    <div className="profile-posts-grid">
                        {profile.posts.length > 0 ? (
                            profile.posts.map((post) => (
                                <div key={post._id} className="grid-item">
                                    <a href={`/posts/${post._id}`}>
                                        <img
                                            src={post.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                                            alt="post"
                                            onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'"
                                        />
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0', color: '#8e8e8e' }}>
                                <i className="fas fa-camera" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                                <p style={{ fontWeight: '600', margin: '0 0 0.5rem', color: '#262626' }}>Share Photos</p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>When you share photos, they will appear on your profile.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Saved grid ── */}
                {activeTab === 'saved' && (
                    <div className="profile-posts-grid">
                        {savedPosts.length > 0 ? (
                            savedPosts.map((post) => (
                                <div key={post._id} className="grid-item">
                                    <a href={`/posts/${post._id}`}>
                                        <img
                                            src={post.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                                            alt="post"
                                            onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'"
                                        />
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0', color: '#8e8e8e' }}>
                                <i className="far fa-bookmark" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                                <p style={{ fontWeight: '600', margin: '0 0 0.5rem', color: '#262626' }}>Save photos and videos</p>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Save posts you want to see again — only you can see what you save.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}

module.exports = Profile;
