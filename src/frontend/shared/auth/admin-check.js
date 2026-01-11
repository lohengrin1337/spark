// Checks if admin has token in session, otherwise redirects to the admin-login-page.
// Also check if token has the right role and is not expired

const token = localStorage.getItem("token");

if (!token) {
    window.location.replace('/admin-login.html');
} else {
    try {
        // Parse base-64 encoded jwt token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const { role, exp } = payload;
        const now = Math.floor(Date.now() / 1000);
    
        // Check role & expire date
        if (role !== "admin" || now >= exp) {
            localStorage.removeItem('token');
            window.location.replace('/admin-login.html');
        }
    } catch (err) {
        localStorage.removeItem('token');
        window.location.replace('/admin-login.html');
    }
}
