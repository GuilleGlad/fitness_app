// Archivo: /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { getUsers, getUser, setSettings, getSettings, getCounts } = require('../../controllers/adminController');

// Endpoints
//AUTH - /admin
router.get('/users', authenticateMiddleware, authorizeMiddleware('admin'), getUsers); 
router.get('/user/:id', authenticateMiddleware, authorizeMiddleware('admin'), getUser);
router.post('/settings', authenticateMiddleware, authorizeMiddleware('admin'), setSettings);
router.get('/settings', getSettings);
router.get('/counts', authenticateMiddleware, authorizeMiddleware('admin'), getCounts);
module.exports = router;












