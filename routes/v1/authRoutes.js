// Archivo: /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { registerUser, loginUser, testAuth, refreshToken, logoutUser, meGet, mePut, checkToken} = require('../../controllers/authController');

// Endpoints

router.get('/testauth', authenticateMiddleware, authorizeMiddleware('admin','trainer'), testAuth); //AUTHORIZE ADMIN
//AUTH - /auth
router.post('/register', registerUser); // POST /api/auth/register
router.post('/login', loginUser);   // POST /api/auth/login
router.post('/refresh-token', authenticateMiddleware, refreshToken);
router.get('/logout',authenticateMiddleware, logoutUser);
router.get('/me', authenticateMiddleware, meGet);
router.put('/me', authenticateMiddleware, authorizeMiddleware('admin'), mePut);   //BUSCAR LA MANERA DE DEVOLVER EL ENUM 
router.get('/check-token', checkToken);

module.exports = router;












