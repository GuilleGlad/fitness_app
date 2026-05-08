// Archivo: /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { registerUser, loginUser, testAuth, logoutUser, meGet, mePut } = require('../../controllers/authController');

// Endpoints
router.post('/register', registerUser); // POST /api/auth/register
router.post('/login', loginUser);   // POST /api/auth/login
router.get('/testauth', authenticateMiddleware, authorizeMiddleware('admin'), testAuth); //AUTHORIZE ADMIN
router.get('/logout',authenticateMiddleware, logoutUser);
router.get('/me', authenticateMiddleware, meGet);
router.put('/me', authenticateMiddleware, authorizeMiddleware('admin'), mePut);   //BUSCAR LA MANERA DE DEVOLVER EL ENUM 

module.exports = router;












