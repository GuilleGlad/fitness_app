// Archivo: /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/roleMiddleware');
const { registerUser, loginUser, testAuth } = require('../controllers/authController');

// Endpoints
router.post('/register', registerUser); // POST /api/auth/register
router.post('/login', loginUser);   // POST /api/auth/login
router.get('/test', authenticateMiddleware, authorizeMiddleware('admin'), testAuth);

module.exports = router;