// Archivo: /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { addExercise,updateExercise, getExercise } = require('../../controllers/exercisesController');

//PLANS - /exercises
router.post('/add', authenticateMiddleware, authorizeMiddleware('admin','trainer'), addExercise);
router.put('/update',authenticateMiddleware, authorizeMiddleware('admin', 'trainer'), updateExercise);
router.get('/get/:id', authenticateMiddleware, getExercise);

module.exports = router;




