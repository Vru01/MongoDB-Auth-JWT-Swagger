const express = require('express');
const router = express.Router();
const { validateSignup, validateLogin } = require('../middlewares/validateMiddleware'); 
const authMiddleware = require('../middlewares/authMiddleware');
const { signup, login, refreshToken, logout, getProfile } = require('../controllers/authController');

// Routes
router.post('/signup', validateSignup, signup); // Added validation middleware
router.post('/login', validateLogin, login);    // Added validation middleware
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;