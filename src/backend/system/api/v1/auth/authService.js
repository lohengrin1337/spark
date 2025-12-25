// auth service
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
    // check db for matching email
    // if unique - allow register
    // hash password
    // save in db (authModel)
    // create jwt
    // return jwt
const authModel = require('./authModel');

/**
 * Oauth register/login.
 * Registers customer if not already registered.
 * Returns a jwt if successful.
 * @param { object } customer - contains { name, email, oauth_provider, oauth_provicer_id }
 */
async function oauthRegisterOrLogin(customer) {
    const oauthCustomer = authModel.getCustomerByOauth(customer.oauth_provider_id);
    let customerId = oauthCustomer.customer_id;
    if (!oauthCustomer) {
        customerId = authModel.saveOauthCustomer(customer);
    }
    const token = await createJsonWebToken(customer.email, customerId);
    return token;
}
/**
 * Register a new user with email/name/password.
 */
async function registerCustomer(email, name, password) {
    const emailInUse = await authModel.getCustomerByEmail(email);
    if (!name) {
        name = "placeholder";
    };
    if (!emailInUse) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newCustomerId = await authModel.saveEmailCustomer(email, name, hashedPassword); //saves in db
        const token = createJsonWebToken(email, newCustomerId);// get jwt
        return token;
    }
    const err = new Error(
        "This email address is already in use, try another address or log in instead."
    );
    err.status = 409;
    err.name = "Conflict";
    throw err;
};

/**
 * Customer login with email and password.
 * @param { string } email - customer input email.
 * @param { string } password - customer input password.
 */
async function customerEmailLogin(email, password) {
    const customer = await authModel.getCustomerByEmail(email);
    const passwordOk = await bcrypt.compare(password, customer.password);
    if (!passwordOk) {
        const err = new Error(
            "The input password does not match, please type better."
        );
        err.status = 401;
        err.name = "Wrong password";
        throw err;
    }
    const token = createJsonWebToken(email, customer.id);
    return token;
}
/**
 * Create a jwt with user email and oauth_provider_id.
 */
async function createJsonWebToken(email, id) {
    const payload = { email, id };
    const secretKey = process.env.JWT_SECRET;
    const expiration = '1h';
    const token = jwt.sign(payload, secretKey, { expiresIn: expiration});
    return token;
}

module.exports = { registerCustomer, oauthRegisterOrLogin, customerEmailLogin };