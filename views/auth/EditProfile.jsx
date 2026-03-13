const React = require('react');
const Layout = require('../layouts/Layout');
const { getAvatarUrl } = require('../utils/avatar');

function EditProfile({ author, token }) {
  return (
    <Layout token={token}>
      <div className="edit-profile-container">
        <div className="edit-profile-card">
          <div className="edit-profile-header">
            <h2 className="edit-profile-title">Edit Profile</h2>
          </div>

          <form
            className="edit-profile-form"
            action="/authors/profile?_method=PUT"
            method="POST"
            encType="multipart/form-data"
          >
            {/* Profile Picture Section */}
            <div className="profile-picture-section">
              <div className="profile-picture-container">
                <img
                  id="profilePreview"
                  src={getAvatarUrl(author)}
                  alt="Profile"
                  className="profile-picture-preview"
                />
                <div className="profile-picture-overlay">
                  <i className="fas fa-camera"></i>
                </div>
              </div>
              
              <label htmlFor="profilePicture" className="change-photo-btn">
                <i className="fas fa-camera"></i>
                Change Profile Photo
              </label>
              
              <input
                type="file"
                name="profilePicture"
                id="profilePicture"
                accept="image/*"
                className="hidden-file-input"
                onChange={() => {
                  const input = document.getElementById('profilePicture');
                  const preview = document.getElementById('profilePreview');
                  if (input.files && input.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      preview.src = e.target.result;
                    };
                    reader.readAsDataURL(input.files[0]);
                  }
                }}
              />
            </div>

            {/* Form Fields */}
            <div className="edit-form-fields">
              <div className="form-field-group">
                <label htmlFor="name" className="field-label">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={author.name}
                  className="edit-profile-input"
                  placeholder="Enter your name"
                />
              </div>

              <div className="form-field-group">
                <label htmlFor="bio" className="field-label">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  defaultValue={author.bio}
                  className="edit-profile-textarea"
                  placeholder="Write something about yourself..."
                  rows="4"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="edit-profile-actions">
              <button type="submit" className="save-profile-btn">
                <i className="fas fa-check"></i>
                Save Changes
              </button>
              
              <a href="/authors/profile" className="cancel-btn">
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

module.exports = EditProfile;
