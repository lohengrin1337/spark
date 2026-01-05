// Checks if user has token in session or as query parameter, otherwise redirects to the user-login-page.
// Also check if token has the right role and is not expired

let token = localStorage.getItem('token');

if (!token) {
  // Check for token in url query 
  const searchParams = new URLSearchParams(window.location.search);
  token = searchParams.get("token");
  
  if (!token) {
    window.location.replace('/user-login.html');
  } else { 
    localStorage.setItem('token', token);
    window.history.replaceState({}, "", window.location.pathname);
  }
} else {
  try {
    // Parse base-64 encoded jwt token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const { role, exp } = payload;
    const now = Math.floor(Date.now() / 1000);
    
    console.log("ROLE", role);
    console.log("EXP", exp);
    console.log("NOW", now);
    
    // Check role & expire date
    if (role !== "customer" || now > exp) {
      localStorage.removeItem('token');
      window.location.replace('/user-login.html');
    }
  } catch (err) {
    localStorage.removeItem('token');
    window.location.replace('/user-login.html');
  }
}
