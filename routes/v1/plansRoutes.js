// Archivo: /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { registerUser, loginUser, testAuth, logoutUser, meGet, mePut } = require('../../controllers/authController');
const { addPlans, getPlan, getMyPlans } = require('../../controllers/plansController');

//PLANS
router.post('/add', authenticateMiddleware, authorizeMiddleware('admin','trainer'), addPlans);
router.get('/get/:planId', authenticateMiddleware, authorizeMiddleware('admin','trainer'), getPlan);
router.get('/myPlans', authenticateMiddleware, authorizeMiddleware('trainer', 'client'), getMyPlans);


module.exports = router;




