// Checks if admin has token in session, otherwise redirects to the admin-login-page.

if (!localStorage.getItem('adminToken')) {
    window.location.replace('/admin-login.html');
  }