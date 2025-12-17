const router = require('express').Router();
const authService = require('./authService');

/**
 * This endpoint is called from frontend when using GitHub to signup/login,
 * and redirects to github.com
 */
router.get("/github", (req, res) => {
    const callbackUrl = "http://localhost:3000/oauth/github/callback";
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${callbackUrl}&scope=read:user user:email`;
    res.redirect(redirectUrl);
});

/**
 * This endpoint is called by github, and is used to get user data
 */
router.get("/github/callback", async (req, res) => {
    const code = req.query.code;

    // Exchange code for token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code
        })
    });
    const { access_token } = await tokenRes.json();

    // Exchange token for user
    const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${access_token}` }
    });
    const user = await userRes.json();

    console.log("USER FROM GITHUB:", user);
});

module.exports = router;
