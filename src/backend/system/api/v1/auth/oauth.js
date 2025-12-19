const router = require('express').Router();
const authService = require('./authService');

/**
 * This endpoint is called from frontend when using GitHub to signup/login,
 * and redirects to github.com
 */
router.get("/github", (req, res) => {
    console.log("/github ENDPOINT");

    const callbackUrl = "http://localhost:3000/oauth/github/callback";
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${callbackUrl}&scope=read:user user:email`;
    res.redirect(redirectUrl);
});

/**
 * This endpoint is called by github to deliver a code.
 * The code is then exchanged for a token,
 * which is used to fetch user data
 */
router.get("/github/callback", async (req, res) => {
    // Code from github
    const code = req.query.code;

    console.log("CODE FROM GITHUB:", code);

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

    console.log("TOKEN FROM GITHUB:", access_token);

    // Fetch user profile with token
    const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${access_token}` }
    });
    const user = await userRes.json();

    console.log("USER FROM GITHUB:", user);

    // Example of some real user data
    // {
    //     login: 'lohengrin1337',
    //     id: 149483141,
    //     avatar_url: 'https://avatars.githubusercontent.com/u/149483141?v=4',
    //     name: null,
    //     email: null,
    // }

    // Fetch email addresses with token
    const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${access_token}` }
    });
    const emails = await emailsRes.json();
    console.log("emails FROM GITHUB:", emails);

    // Get the primary email address
    const primaryEmail = emails.find(e => e.primary)?.email;
    console.log("primaryEmail FROM GITHUB:", primaryEmail);
    
    // Prepare customer for database
    const customer = {
        name: user.name || null,
        email: primaryEmail || null,
        oauth_provider: "github",
        oauth_provider_id: user.id,
    };
    
    console.log("CUSTOMER:", customer);

    // TOKEN SHOULD BE RETURNED HERE LATER
    res.json({ customer });
});

module.exports = router;
