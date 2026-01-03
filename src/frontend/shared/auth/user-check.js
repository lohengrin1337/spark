// Checks if user has token in session or as query parameter, otherwise redirects to the user-login-page.
let token = localStorage.getItem('token');

if (!token) {
  const searchParams = new URLSearchParams(window.location.search);
  token = searchParams.get("token");

  if (!token) {
    window.location.replace('/user-login.html');
  }

  localStorage.setItem('token', token);
  window.history.replaceState({}, "", window.location.pathname);
}

try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const { role } = payload;

  console.log("ROLE", role);

  if (role !== "customer") {
    window.location.replace("/403.html");
  }
} catch (err) {
  console.error("Invalid token", err);
  localStorage.removeItem('token');
  window.location.replace('/user-login.html');
}
