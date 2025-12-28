// Checks if user has token in session, otherwise redirects to the user-login-page.

if (!localStorage.getItem('userToken')) {
    window.location.replace('/user-login.html');
  }