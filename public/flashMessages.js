// flashMessages.js

document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.alert');

  if (alerts.length > 0) {
    alerts.forEach(alert => {
      setTimeout(() => {
        alert.classList.add('fade');
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500); // remove after fade out
      }, 1000); // show for 3 seconds
    });
  }
});
