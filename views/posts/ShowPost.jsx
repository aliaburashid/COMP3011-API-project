const React = require('react');
const Layout = require('../layouts/Layout');
const { getAvatarUrl } = require('../utils/avatar');

function ShowPost({ post, token, currentUserId, savedPostIds }) {
    const liked = currentUserId && post.likedBy &&
        post.likedBy.some(id => id.toString() === currentUserId)
    const saved = savedPostIds && savedPostIds.includes(post._id.toString())
    const isOwner = currentUserId && post.author._id.toString() === currentUserId

    const captionWords = post.caption.split(/(\s+)/).map((word, i) =>
        word.startsWith('#')
            ? <a key={i} href={`/tags/${word.slice(1)}`}
                 style={{ color: '#00376b', textDecoration: 'none', fontWeight: '400' }}>{word}</a>
            : word
    )

    return (
        <Layout token={token}>
            {/* ── Back navigation ── */}
            <div style={{ maxWidth: '935px', margin: '0 auto 1rem', padding: '0 1rem' }}>
                <a
                    href="javascript:history.back()"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        color: '#262626', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem',
                    }}
                >
                    <i className="fas fa-chevron-left" style={{ fontSize: '0.8rem' }}></i>
                    Back
                </a>
            </div>

            {/* ── Post box ── */}
            <div style={{
                maxWidth: '935px',
                margin: '0 auto',
                display: 'flex',
                border: '1px solid #dbdbdb',
                borderRadius: '4px',
                background: '#fff',
                minHeight: '500px',
                overflow: 'hidden',
            }}>

                {/* ── Left: Image ── */}
                <div style={{
                    flex: '0 0 55%',
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    <img
                        src={post.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                        alt="Post"
                        onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                </div>

                {/* ── Right: Content ── */}
                <div style={{
                    flex: '0 0 45%',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '600px',
                }}>

                    {/* ── Header ── */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid #efefef',
                        flexShrink: 0,
                    }}>
                        <a
                            href={`/authors/${post.author._id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}
                        >
                            <img
                                src={getAvatarUrl(post.author)}
                                alt={post.author.name}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    objectFit: 'cover', border: '1px solid #dbdbdb',
                                }}
                            />
                            <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#262626' }}>
                                {post.author.name}
                            </span>
                        </a>

                        {/* Options menu */}
                        {isOwner && (
                            <form
                                action={`/posts/${post._id}?_method=DELETE`}
                                method="POST"
                                style={{ margin: 0 }}
                                onsubmit="return confirm('Delete this post?')"
                            >
                                <button
                                    type="submit"
                                    title="Delete post"
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#8e8e8e', fontSize: '1.1rem', padding: '0.25rem',
                                    }}
                                >
                                    <i className="fas fa-trash-alt" style={{ fontSize: '0.85rem' }}></i>
                                </button>
                            </form>
                        )}
                    </div>

                    {/* ── Comments + Caption (scrollable) ── */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0.75rem 1rem',
                    }}>
                        {/* Caption as first "comment" */}
                        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem' }}>
                            <img
                                src={getAvatarUrl(post.author)}
                                alt={post.author.name}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    objectFit: 'cover', flexShrink: 0, border: '1px solid #dbdbdb',
                                }}
                            />
                            <div style={{ fontSize: '0.875rem', lineHeight: '1.5', paddingTop: '0.1rem' }}>
                                <span style={{ fontWeight: '600', color: '#262626', marginRight: '0.3rem' }}>
                                    {post.author.name}
                                </span>
                                <span style={{ color: '#262626' }}>{captionWords}</span>
                                {post.hashtags && post.hashtags.length > 0 && (
                                    <div style={{ marginTop: '0.3rem', display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                        {post.hashtags.map(tag => (
                                            <a key={tag} href={`/tags/${tag}`}
                                               style={{ color: '#00376b', fontSize: '0.875rem', textDecoration: 'none' }}>
                                                #{tag}
                                            </a>
                                        ))}
                                    </div>
                                )}
                                <div style={{ color: '#8e8e8e', fontSize: '0.7rem', marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                    {new Date(post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        {post.comments.length > 0 && (
                            <div style={{ borderTop: '1px solid #efefef', marginBottom: '0.75rem' }}></div>
                        )}

                        {/* Comments */}
                        {post.comments.length === 0 ? (
                            <p style={{ color: '#8e8e8e', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>
                                No comments yet. Be the first!
                            </p>
                        ) : (
                            post.comments.map((comment) => {
                                const isMyComment = currentUserId && comment.author._id.toString() === currentUserId
                                return (
                                    <div key={comment._id} style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.9rem', alignItems: 'flex-start' }}>
                                        <img
                                            src={getAvatarUrl(comment.author)}
                                            alt={comment.author.name}
                                            style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                objectFit: 'cover', flexShrink: 0, border: '1px solid #dbdbdb',
                                            }}
                                        />
                                        <div style={{ flex: 1, fontSize: '0.875rem', lineHeight: '1.5', paddingTop: '0.1rem' }}>
                                            <span style={{ fontWeight: '600', color: '#262626', marginRight: '0.35rem' }}>
                                                {comment.author.name}
                                            </span>
                                            <span style={{ color: '#262626' }}>{comment.content}</span>
                                        </div>
                                        {isMyComment && (
                                            <form
                                                action={`/posts/${post._id}/comments/${comment._id}?_method=DELETE`}
                                                method="POST"
                                                style={{ margin: 0, flexShrink: 0 }}
                                            >
                                                <button type="submit" title="Delete comment" style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#8e8e8e', padding: '0.1rem 0.25rem', fontSize: '0.75rem',
                                                    lineHeight: 1,
                                                }}>
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* ── Action bar ── */}
                    <div style={{ borderTop: '1px solid #efefef', flexShrink: 0 }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                        }}>
                            {/* Left actions */}
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                <form action={`/posts/${post._id}/like`} method="POST" style={{ margin: 0 }}>
                                    <button type="submit" title={liked ? 'Unlike' : 'Like'} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: '0.4rem', fontSize: '1.4rem', lineHeight: 1,
                                        color: liked ? '#ed4956' : '#262626',
                                    }}>
                                        <i className={liked ? 'fas fa-heart' : 'far fa-heart'}></i>
                                    </button>
                                </form>

                                <button style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '0.4rem', fontSize: '1.3rem', lineHeight: 1, color: '#262626',
                                }}>
                                    <i className="far fa-comment"></i>
                                </button>

                                <button style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '0.4rem', fontSize: '1.2rem', lineHeight: 1, color: '#262626',
                                }}>
                                    <i className="far fa-paper-plane"></i>
                                </button>
                            </div>

                            {/* Bookmark */}
                            <form action={`/posts/${post._id}/save`} method="POST" style={{ margin: 0 }}>
                                <button type="submit" title={saved ? 'Unsave' : 'Save'} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '0.4rem', fontSize: '1.2rem', lineHeight: 1, color: '#262626',
                                }}>
                                    <i className={saved ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
                                </button>
                            </form>
                        </div>

                        {/* Likes count */}
                        <div style={{ padding: '0 1rem 0.4rem', fontSize: '0.875rem', fontWeight: '600', color: '#262626' }}>
                            {post.likesCount.toLocaleString()} likes
                        </div>

                        {/* Add comment form */}
                        <form
                            action={`/posts/${post._id}/comments`}
                            method="POST"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                borderTop: '1px solid #efefef',
                                padding: '0.5rem 1rem',
                                gap: '0.5rem',
                            }}
                        >
                            <input
                                type="text"
                                name="content"
                                placeholder="Add a comment…"
                                required
                                style={{
                                    flex: 1, border: 'none', outline: 'none',
                                    fontSize: '0.875rem', color: '#262626', background: 'transparent',
                                }}
                            />
                            <button type="submit" style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#0095f6', fontWeight: '600', fontSize: '0.875rem', padding: 0,
                            }}>
                                Post
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </Layout>
    );
}

module.exports = ShowPost;
