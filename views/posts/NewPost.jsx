const React = require('react')
const Layout = require('../layouts/Layout')

function NewPost(props) {
  const token = props.token

  return (
    <Layout token={token}>
      <div className="new-post-container">
        <div className="new-post-card">
          <div className="new-post-header">
            <h2 className="new-post-title">Create New Post</h2>
          </div>
          
          <form
            action="/posts"
            method="POST"
            encType="multipart/form-data"
            className="new-post-form"
          >
            {/* File Upload Section */}
            <div className="file-upload-section">
              <label className="file-upload-label">
                <div className="upload-area">
                  <i className="fas fa-camera"></i>
                  <span className="upload-text">Click to upload photo</span>
                  <span className="upload-hint">or drag and drop</span>
                </div>
                <input type="file" name="image" required accept="image/*" />
              </label>
            </div>

            {/* Form Fields */}
            <div className="form-fields">
              <div className="form-group">
                <textarea
                  name="caption"
                  placeholder="Write a caption..."
                  className="new-post-caption"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="location"
                  placeholder="📍 Add location"
                  className="new-post-location"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="submit-section">
              <button type="submit" className="new-post-submit">
                <i className="fas fa-paper-plane"></i>
                Share
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

module.exports = NewPost
