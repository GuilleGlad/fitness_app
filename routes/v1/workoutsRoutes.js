const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { listByClient, assignWorkout, deassignWorkout, updateDailyWorkout, listByTrainer, deleteWorkout, addWorkout, updateWorkout, addNoteToWorkout, getWorkoutNote} = require('../../controllers/workoutsController');

//WORKOUTS - /workouts
router.get('/list/:client_id', authenticateMiddleware, authorizeMiddleware('trainer','admin', 'client'), listByClient);
router.get('/list-by-trainer/:trainer_id', authenticateMiddleware, authorizeMiddleware('trainer','admin'), listByTrainer);
router.post('/add', authenticateMiddleware, authorizeMiddleware('trainer','admin'), assignWorkout); //daily_workouts
router.post('/add-workout', authenticateMiddleware, authorizeMiddleware('trainer','admin'), addWorkout); //workout_items
router.delete('/delete/:id', authenticateMiddleware, authorizeMiddleware('trainer','admin'), deassignWorkout); //daily_workouts
router.delete('/delete-workout/:id', authenticateMiddleware, authorizeMiddleware('trainer','admin'), deleteWorkout); //workout_items
router.put('/update/:id', authenticateMiddleware, authorizeMiddleware('trainer','admin'), updateDailyWorkout);
router.put('/update-workout/:id', authenticateMiddleware, authorizeMiddleware('trainer','admin'), updateWorkout);
router.post('/add-note', authenticateMiddleware, authorizeMiddleware('client'), addNoteToWorkout);
router.get('/get-note', authenticateMiddleware, authorizeMiddleware('trainer','admin', 'client'), getWorkoutNote);
module.exports = router;
