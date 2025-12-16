const router = require('express').Router();

const authService = require('./authService');

/**
 * POST register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password; // if registering "normally"
    // const token = req.body.token; // if registering with OAuth
    // auth service:
    // check db for matching email
    // if unique - allow register
    // hash password
    // save in db (authModel)
    // create jwt
    // return jwt
    const newUser = await authService.registerUser(email, password); // token/password defaults to null?
    // also login user automatically?
    // redirect to login route?
    return res.status(201).json({ "Token": newUser});
//     try {
//     // checks if email exists in database
//     const userExists = await documents.getUserByEmail(email);

//     if (userExists) {
//         return res.status(409).json({
//             message: `A user with this email address already exists in the database, 
//             try loggin in instead.`
//         });
//     }
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt); // hash password
//     const userData = {
//         email: email,
//         password: hashedPassword,
//     };
//     const newUser = await documents.addUser(userData); // add user to database
//     const newId = newUser.insertedId;
//     // login new user
//     const token = jwt.sign( {
//         _id: newId, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h'});

//     return res.status(201).json({ userId: newId, token: token });
// } catch (e) {
//     console.log(e);
// }
});

/**
 * POST login
 * User login
 */
router.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password; // if logging in with password
    const token = req.body.token; // if logging in with OAuth
    // auth service:
    // check login info
    // return jwt if successful
    const userToken = await authService.loginUser(email, password, token);
    return res.status(200).json({ "Token": userToken});
});

/**
 * POST admin-login
 * Admin login
 */
router.post('/admin-login', async (req, res) => {
    const admin = req.body.admin;
    const password = req.body.password;
    // auth service:
    // check login info
    // return jwt if successful
    const adminToken = await authService.loginAdmin(admin, password);
    return res.status(200).json({ "Token": adminToken});
});
