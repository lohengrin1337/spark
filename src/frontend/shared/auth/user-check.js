// Checks if user has token in session or as query parameter, otherwise redirects to the user-login-page.

if (!localStorage.getItem('userToken')) {
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  if (!token) {
    window.location.replace('/user-login.html');
  } else {
    localStorage.setItem('userToken', token);
    window.history.replaceState({}, "", window.location.pathname);  // remove token from url
  }
}