const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper: Generate Token
const generateAccessToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
};

// 1. SIGNUP 
exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. LOGIN 
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        // Generate Access Token
        const accessToken = generateAccessToken(user);

        // Generate Refresh Token
        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

        // Save Refresh Token to DB
        let expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

        await new RefreshToken({
            token: refreshToken,
            user: user._id,
            expiryDate: expiryDate,
        }).save();

        res.json({
            accessToken,
            refreshToken,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. REFRESH TOKEN 
exports.refreshToken = async (req, res) => {
    const { requestToken } = req.body;

    if (!requestToken) {
        return res.status(403).json({ msg: 'Refresh Token is required!' });
    }

    try {
        // Find token in DB
        let refreshToken = await RefreshToken.findOne({ token: requestToken });

        if (!refreshToken) {
            return res.status(403).json({ msg: 'Refresh token is not in database!' });
        }

        // Verify Expiration
        if (RefreshToken.verifyExpiration(refreshToken)) {
            await RefreshToken.findByIdAndRemove(refreshToken._id);
            return res.status(403).json({ msg: 'Refresh token was expired. Please make a new signin request' });
        }

        // Generate new Access Token
        const user = await User.findById(refreshToken.user);
        const newAccessToken = generateAccessToken(user);

        res.json({
            accessToken: newAccessToken,
            refreshToken: refreshToken.token,
        });
    } catch (err) {
        return res.status(500).send({ message: err });
    }
};

// 4. LOGOUT (Revoke Token)
exports.logout = async (req, res) => {
    try {
        const { requestToken } = req.body;
        await RefreshToken.findOneAndDelete({ token: requestToken });
        res.status(200).json({ msg: 'Logged out successfully!' });
    } catch (err) {
        res.status(500).send({ message: err });
    }
};

// 5. GET USER PROFILE 
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};