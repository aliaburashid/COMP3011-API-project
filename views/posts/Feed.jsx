const React = require('react');
const Layout = require('../layouts/Layout');
const { getAvatarUrl } = require('../utils/avatar');

function Feed(props) {
    const { posts, token, currentUserId, savedPostIds } = props;

    return (
        <Layout token={token}>
            <div className="app-container">
                {/* All Posts */}
                <div className="posts-container">
                    {posts.map((post) => (
                        <div key={post._id} id={`post-${post._id}`} className="post-card">
                            {/* Post Header */}
                            <div className="post-header">
                                <div className="post-author">
                                    <img
                                        src={getAvatarUrl(post.author)}
                                        alt={post.author.name}
                                        className="author-avatar"
                                    />
                                    <span className="author-name">{post.author.name}</span>
                                </div>
                            </div>

                            {/* Post Image */}
                            <div className="post-image">
                                <img
                                    src={post.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                                    alt="Post"
                                    onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'"
                                />
                            </div>

                            {/* Post Actions */}
                            <div className="post-actions-bar">
                                <div className="action-buttons">
                                    {/* Like button — red if already liked */}
                                    {(() => {
                                        const liked = currentUserId && post.likedBy &&
                                            post.likedBy.some(id => id.toString() === currentUserId)
                                        return (
                                            <form action={`/posts/${post._id}/like`} method="POST" style={{ display: 'inline', margin: 0 }}>
                                                <button type="submit" className="action-btn like-btn" title={liked ? 'Unlike' : 'Like'}>
                                                    <i className={liked ? 'fas fa-heart' : 'far fa-heart'}
                                                       style={{ color: liked ? '#ed4956' : 'inherit' }}></i>
                                                </button>
                                            </form>
                                        )
                                    })()}
                                    <button className="action-btn">
                                        <i className="far fa-comment"></i>
                                    </button>
                                    <button className="action-btn">
                                        <i className="far fa-paper-plane"></i>
                                    </button>
                                </div>
                                {/* Bookmark button */}
                                {(() => {
                                    const saved = savedPostIds && savedPostIds.includes(post._id.toString())
                                    return (
                                        <form action={`/posts/${post._id}/save`} method="POST" style={{ display: 'inline', margin: 0 }}>
                                            <button type="submit" className="action-btn save-btn" title={saved ? 'Unsave' : 'Save'}>
                                                <i className={saved ? 'fas fa-bookmark' : 'far fa-bookmark'}
                                                   style={{ color: saved ? '#262626' : 'inherit' }}></i>
                                            </button>
                                        </form>
                                    )
                                })()}
                            </div>

                            {/* Likes Count */}
                            <div className="post-likes">
                                <span className="likes-count">{post.likesCount} likes</span>
                            </div>

                            {/* Caption with clickable hashtags */}
                            <div className="post-caption">
                                <span className="caption-author">{post.author.name}</span>{' '}
                                <span className="caption-text">
                                    {post.caption.split(/(\s+)/).map((word, i) =>
                                        word.startsWith('#')
                                            ? <a key={i} href={`/tags/${word.slice(1)}`}
                                                 style={{ color: '#00376b', textDecoration: 'none' }}>{word}</a>
                                            : word
                                    )}
                                </span>
                            </div>
                            {/* Hashtag pills */}
                            {post.hashtags && post.hashtags.length > 0 && (
                                <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    {post.hashtags.map(tag => (
                                        <a key={tag} href={`/tags/${tag}`}
                                           style={{ color: '#00376b', fontSize: '0.85rem', textDecoration: 'none' }}>
                                            #{tag}
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* Timestamp */}
                            <div className="post-timestamp">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </div>

                            {/* Comments Section */}
                            <div className="comments-section">
                                {post.comments.length > 0 ? (
                                    <>
                                        {/* Show first 2 comments */}
                                        {post.comments.slice(0, 2).map((comment) => (
                                            <div key={comment._id} className="post-caption">
                                                <span className="caption-author">{comment.author.name}</span>{' '}
                                                <span className="caption-text">{comment.content}</span>
                                            </div>
                                        ))}
                                        
                                        {/* Show "View more comments" if there are more than 2 comments */}
                                        {post.comments.length > 2 && (
                                            <div className="view-more-comments" style={{ display: 'none' }}>
                                                {post.comments.slice(2).map((comment) => (
                                                    <div key={comment._id} className="post-caption">
                                                        <span className="caption-author">{comment.author.name}</span>{' '}
                                                        <span className="caption-text">{comment.content}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* View more button */}
                                        {post.comments.length > 2 && (
                                            <button 
                                                className="view-more-btn" 
                                                onClick="toggleFeedComments(this)"
                                                data-post-id={post._id}
                                            >
                                                View all {post.comments.length} comments
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <p className="no-comments">No comments yet</p>
                                )}
                            </div>

                            {/* Comment Form */}
                            <form
                                className="comment-form"
                                action={`/posts/${post._id}/comments`}
                                method="POST"
                            >
                                <input
                                    type="text"
                                    name="content"
                                    placeholder="Add a comment..."
                                    required
                                />
                                <button type="submit">Post</button>
                            </form>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}

module.exports = Feed;
