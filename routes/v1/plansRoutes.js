// Archivo: /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { addPlans, getPlan, getMyPlans, assignPlan } = require('../../controllers/plansController');

//PLANS - /plans
router.post('/add', authenticateMiddleware, authorizeMiddleware('admin','trainer'), addPlans);
router.get('/get/:planId', authenticateMiddleware, authorizeMiddleware('admin','trainer'), getPlan);
router.get('/mine', authenticateMiddleware, authorizeMiddleware('trainer', 'client'), getMyPlans);
router.post('/assign', authenticateMiddleware, authorizeMiddleware('admin','trainer'), assignPlan);


module.exports = router;




