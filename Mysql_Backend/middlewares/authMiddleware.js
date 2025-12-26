const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Get the token from the header
    const tokenHeader = req.header('Authorization');

    // 2. Check if no token exists
    if (!tokenHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // 3. Extract the token (Remove 'Bearer ' prefix)
        const token = tokenHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ msg: 'Token format incorrect' });
        }

        // 4. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Add user to request object
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};