const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const {addProgress, listProgress, getProgress} = require('../../controllers/progressController');

//PLANS - /progress
router.post('/add', authenticateMiddleware, authorizeMiddleware('client'),addProgress);
router.get('/list', authenticateMiddleware, authorizeMiddleware('client', 'trainer'), listProgress);
router.get('/get/:clientId', authenticateMiddleware, authorizeMiddleware('trainer', 'admin'), getProgress);
module.exports = router;




