const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: Generate Token (Updated to use user.id)
const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
};

// 1. SIGNUP
exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // CHECK: user exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // CREATE: User
        await User.create({ username, email, password: hashedPassword });

        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const accessToken = generateAccessToken(user);
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

        // Save Refresh Token
        let expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        await RefreshToken.create({
            token: refreshToken,
            UserId: user.id, // Sequelize adds 'UserId' automatically because of 'belongsTo'
            expiryDate: expiryDate,
        });

        res.json({
            accessToken,
            refreshToken,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. REFRESH TOKEN
exports.refreshToken = async (req, res) => {
    const { requestToken } = req.body;
    if (!requestToken) return res.status(403).json({ msg: 'Refresh Token is required!' });

    try {
        const refreshToken = await RefreshToken.findOne({ where: { token: requestToken } });

        if (!refreshToken) return res.status(403).json({ msg: 'Refresh token is not in database!' });

        if (RefreshToken.verifyExpiration(refreshToken)) {
            await RefreshToken.destroy({ where: { id: refreshToken.id } });
            return res.status(403).json({ msg: 'Refresh token was expired. Please make a new signin request' });
        }

        const user = await User.findByPk(refreshToken.UserId);
        const newAccessToken = generateAccessToken(user);

        res.json({
            accessToken: newAccessToken,
            refreshToken: refreshToken.token,
        });
    } catch (err) {
        return res.status(500).send({ message: err.message });
    }
};

// 4. LOGOUT
exports.logout = async (req, res) => {
    try {
        const { requestToken } = req.body;
        await RefreshToken.destroy({ where: { token: requestToken } });
        res.status(200).json({ msg: 'Logged out successfully!' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

// 5. GET USER PROFILE
exports.getProfile = async (req, res) => {
    try {
        // req.user.id is now an INTEGER, not an ObjectId
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// 6. GOOGLE LOGIN
exports.googleLogin = async (req, res) => {
    const { token } = req.body; // The token we get from Frontend

    try {
        // 1. Verify token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, name, sub } = ticket.getPayload(); // 'sub' is Google's unique ID for this user

        // 2. Check if user exists in our DB
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // 3. If not, CREATE them
            // We set a random password because they won't use it anyway
            const randomPassword = Math.random().toString(36).slice(-8); 
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = await User.create({
                username: name,
                email: email,
                password: hashedPassword, // Dummy password
            });
        }

        // 4. Generate OUR tokens (Same as standard login!)
        const accessToken = generateAccessToken(user);
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

        // Save Refresh Token
        let expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        await RefreshToken.create({ token: refreshToken, UserId: user.id, expiryDate: expiryDate });

        // 5. Respond
        res.json({
            accessToken,
            refreshToken,
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (err) {
        res.status(400).json({ msg: "Google Sign-In Failed", error: err.message });
    }
};