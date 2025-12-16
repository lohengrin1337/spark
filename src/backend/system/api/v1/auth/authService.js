    // auth service:
    // check db for matching email
    // if unique - allow register
    // hash password
    // save in db (authModel)
    // create jwt
    // return jwt
const authModel = require('./authModel');

/**
 * Register a new user
 * @returns JWT token if successful.
 */
async function registerUser(email = null, password = null, token = null) {
    const emailInUse = await authModel.emailExists(email);
    if (!emailInUse) {
        // hash password
        await authModel.createUser(email, password); //saves in db
        // get jwt
        return token;
    }
}