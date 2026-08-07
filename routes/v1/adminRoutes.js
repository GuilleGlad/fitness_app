// Archivo: /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { getUsers, getUser, setSettings, getSettings, getCounts, getClients, getTrainers, deleteUser, updateUser, restoreUser, getCountsByTrainer} = require('../../controllers/adminController');

// Endpoints
//AUTH - /admin
router.get('/users', authenticateMiddleware, authorizeMiddleware('admin'), getUsers); 
router.get('/user/:id', authenticateMiddleware, authorizeMiddleware('admin'), getUser);
router.delete('/user/:id', authenticateMiddleware, authorizeMiddleware('admin'), deleteUser);
router.put('/user-restore/:id', authenticateMiddleware, authorizeMiddleware('admin'), restoreUser);
router.put('/user/:id', authenticateMiddleware, authorizeMiddleware('admin'), updateUser);
router.post('/settings', authenticateMiddleware, authorizeMiddleware('admin'), setSettings);
router.get('/settings', getSettings);
router.get('/counts', authenticateMiddleware, authorizeMiddleware('admin'), getCounts);
router.get('/counts-by-trainer/:trainer_id', authenticateMiddleware, getCountsByTrainer);
router.get('/clients', authenticateMiddleware, authorizeMiddleware('admin','trainer','client'), getClients);
router.get('/trainers', authenticateMiddleware, getTrainers);

module.exports = router;












