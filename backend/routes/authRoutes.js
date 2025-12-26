const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { signup, login, getProfile } = require('../controllers/authController');

// Routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile); // Protected Route

module.exports = router;