const router = require('express').Router();

const authService = require('./authService');

/**
 * POST register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const newUser = await authService.registerCustomer(email, name, password);
    // also login user automatically?
    // redirect to login route?
    return res.status(201).json({ "Token": newUser});
});

/**
 * POST login
 * User login
 */
router.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    // auth service:
    // check login info
    // return jwt if successful
    const userToken = await authService.customerEmailLogin(email, password);
    return res.status(200).json({ "Token": userToken});
});

/**
 * POST admin-login
 * Admin login
 */
router.post('/admin-login', async (req, res) => {
    const admin = req.body.adminId;
    const password = req.body.password;
    // auth service:
    // check login info
    // return jwt if successful
    const adminToken = await authService.adminLogin(admin, password);
    return res.status(200).json({ "Token": adminToken});
});

/**
 * POST third-party-login
 * Third party login
 */
router.post('/third_party-login', async (req, res) => {
    const thirdParty = req.body.thirdPartyId;
    const password = req.body.password;
    // auth service:
    // check login info
    // return jwt if successful
    const thirdPartyToken = await authService.thirdPartyLogin(thirdParty, password);
    return res.status(200).json({ "Token": thirdPartyToken});
});




module.exports = router;
