const React = require('react')

function Layout(props) {
  const { token } = props

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>FlickGallery</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />

      </head>
      <body>
        {/* Top Navigation Bar */}
        <header style={{ borderBottom: '1px solid #dbdbdb', background: 'white' }}>
          <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
            {/* Logo - goes to home/feed page */}
            <a href={token ? '/posts' : '/'} style={{ textDecoration: 'none', fontSize: '2.2rem', fontWeight: '700', color: '#262626', fontFamily: "'Dancing Script', cursive" }}>
              FlickGallery
            </a>

            {/* Navigation icons */}
            <nav style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
              {/* Home icon */}
              <a href={token ? '/posts' : '/'}><i className="fas fa-home"></i></a>
              {/* Explore icon */}
              <a href={token ? '/explore' : '#'} title="Explore people"><i className="fas fa-compass"></i></a>
              {/* New Post icon */}
              <a href={token ? '/posts/new' : '#'}><i className="fas fa-plus-square"></i></a>
              {/* Profile icon */}
              <a href={token ? '/authors/profile' : '#'}><i className="far fa-user-circle"></i></a>
              {/* Logout button */}
              {token && (
                <form action="/authors/logout" method="POST" style={{ margin: 0 }}>
                  <button type="submit" className="logout-btn">
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                </form>
              )}
            </nav>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="app-container" style={{ marginTop: '2rem' }}>
          {props.children}
        </main>

        <script dangerouslySetInnerHTML={{
          __html: `
            function toggleComments(buttonElement) {
              console.log('Toggle function called');
              const viewMoreBtn = buttonElement;
              const hiddenComments = buttonElement.parentElement.querySelector('.view-more-comments');
              
              console.log('Button:', viewMoreBtn);
              console.log('Hidden comments:', hiddenComments);
              
              if (hiddenComments && viewMoreBtn) {
                console.log('Elements found, toggling...');
                if (hiddenComments.style.display === 'none' || hiddenComments.style.display === '') {
                  hiddenComments.style.display = 'block';
                  viewMoreBtn.textContent = 'View less';
                  console.log('Comments expanded');
                } else {
                  hiddenComments.style.display = 'none';
                  const commentCount = hiddenComments.querySelectorAll('.single-post-comment').length + 2;
                  viewMoreBtn.textContent = 'View all ' + commentCount + ' comments';
                  console.log('Comments collapsed');
                }
              } else {
                console.log('Elements not found');
              }
            }
            
            function toggleFeedComments(buttonElement) {
              console.log('Feed toggle function called');
              const viewMoreBtn = buttonElement;
              const hiddenComments = buttonElement.parentElement.querySelector('.view-more-comments');
              
              console.log('Button:', viewMoreBtn);
              console.log('Hidden comments:', hiddenComments);
              
              if (hiddenComments && viewMoreBtn) {
                console.log('Elements found, toggling...');
                if (hiddenComments.style.display === 'none' || hiddenComments.style.display === '') {
                  hiddenComments.style.display = 'block';
                  viewMoreBtn.textContent = 'View less';
                  console.log('Feed comments expanded');
                } else {
                  hiddenComments.style.display = 'none';
                  const commentCount = hiddenComments.querySelectorAll('.post-caption').length + 2;
                  viewMoreBtn.textContent = 'View all ' + commentCount + ' comments';
                  console.log('Feed comments collapsed');
                }
              } else {
                console.log('Elements not found');
              }
            }
            
            // Make functions globally available
            window.toggleComments = toggleComments;
            window.toggleFeedComments = toggleFeedComments;
            console.log('Comment functionality loaded in Layout');
          `
        }} />
      </body>
    </html>
  )
}

module.exports = Layout
