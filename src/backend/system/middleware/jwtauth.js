const jwt = require('jsonwebtoken');

// middleware that checks the jwt
function authToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {return res.sendStatus(401);}

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {return res.sendStatus(403);}
        req.user = user; // contains user.id, user.role
        console.log("from auth ", req.user);
        next();
    });
}

// middleware that checks if role is admin/user or other
function authAdminOrUser(req, res, next) {
    const role = req.user.role;
    if (req.user.role !== "admin" && req.user.role !== "customer") {return res.sendStatus(403);}
    next();
}

// middleware that checks if role is admin
function authAdmin(req, res, next) {
    const role = req.user.role;

    if (req.user.role !== "admin") {return res.sendStatus(403);}

    next();
}


module.exports = { authToken, authAdminOrUser, authAdmin };