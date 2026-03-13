// Comment toggle functionality for single post view
function toggleComments(buttonElement) {
    // Find the button that was clicked
    const viewMoreBtn = buttonElement;
    const hiddenComments = buttonElement.parentElement.querySelector('.view-more-comments');
    
    console.log('Toggle function called');
    console.log('Hidden comments element:', hiddenComments);
    console.log('View more button:', viewMoreBtn);
    
    if (hiddenComments && viewMoreBtn) {
        console.log('Elements found, toggling...');
        if (hiddenComments.style.display === 'none' || hiddenComments.style.display === '') {
            hiddenComments.style.display = 'block';
            viewMoreBtn.textContent = 'View less';
            console.log('Comments expanded');
        } else {
            hiddenComments.style.display = 'none';
            // Get the original text from the button's data attribute or reconstruct it
            const commentCount = hiddenComments.querySelectorAll('.single-post-comment').length + 2; // +2 for the initially visible comments
            viewMoreBtn.textContent = `View all ${commentCount} comments`;
            console.log('Comments collapsed');
        }
    } else {
        console.log('Elements not found');
    }
}

// Make function globally available
window.toggleComments = toggleComments;

// Add event listener when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, comment functionality ready');
}); 