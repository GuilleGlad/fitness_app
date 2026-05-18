// Archivo: /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { getUsers, getUser } = require('../../controllers/adminController');

// Endpoints
//AUTH - /admin
router.get('/users', authenticateMiddleware, authorizeMiddleware('admin'), getUsers); 
router.get('/user/:id', authenticateMiddleware, authorizeMiddleware('admin'), getUser);
module.exports = router;












