// Checks if user has token in session, otherwise redirects to the user-login-page.

if (!localStorage.getItem('token')) {
    window.location.replace('/user-login.html');
  }
// Checks if admin has token in session, otherwise redirects to the admin-login-page.
const token = localStorage.getItem("token");
console.log(token);
const { role } = JSON.parse(atob(token.split(".")[1]));
console.log("ROLE", role);
function checkTokenRole(token) {
    if (!token) {
        window.location.replace('/user-login.html');
        console.log("AAAAAA")
        return;
      }

}
if (role !== "customer") location.href = "/403.html";
