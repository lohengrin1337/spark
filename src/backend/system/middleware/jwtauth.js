const jwt = require('jsonwebtoken');

// middleware that checks the jwt
function authToken(req, res, next) {
    if (process.env.NODE_ENV === 'test') {
        req.user = { id: "admin", role: "admin"};
        return next();
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {return res.sendStatus(401);}

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {return res.sendStatus(403);}
        req.user = {
            id: user.id,
            role: user.role
        };
        next();
    });
}

// middleware that checks if role is admin/u ser or other
function authAdminOrUser(req, res, next) {
    if (process.env.NODE_ENV === 'test') {
        req.user = { id: "admin", role: "admin"};
    return next();
  }
    const role = req.user.role;
    if (role !== "admin" && req.user.role !== "customer") {return res.sendStatus(403);}
    next();
}

// middleware that checks if role is admin
function authAdmin(req, res, next) {
    if (process.env.NODE_ENV === 'test') {
        req.user = { id: "admin", role: "admin"};
        return next();
    }

    const role = req.user.role;

    if (role !== "admin") {return res.sendStatus(403);}

    next();
}

function authAdminOrDevice(req, res, next) {
    const role = req.user.role;

    if (role !== "device" && role !== "admin") {return res.sendStatus(403);}

    next();
}

function authAdminOrUserOrDevice(req, res, next) {
    const role = req.user.role;

    if (role !== "device" && role !== "admin" && role !== "customer") {return res.sendStatus(403);}

    next();
}


module.exports = { authToken, authAdminOrUser, authAdmin, authAdminOrDevice, authAdminOrUserOrDevice };