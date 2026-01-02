// Checks if admin has token in session, otherwise redirects to the admin-login-page.
const token = localStorage.getItem("token");
console.log(token);
if (!token) {
    window.location.replace('/admin-login.html');
  }
const { role } = JSON.parse(atob(token.split(".")[1]));
if (role !== "admin") location.href = "/403.html";