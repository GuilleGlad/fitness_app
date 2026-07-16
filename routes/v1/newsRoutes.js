const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const {addNew, listNews, getNew, updateNew, deleteNew} = require('../../controllers/newsController');

//PLANS - /progress
router.post('/add', authenticateMiddleware, authorizeMiddleware('trainer','admin'),addNew);
router.get('/list', listNews);
router.get('/get/:newId', authenticateMiddleware, getNew);
router.put('/update', authenticateMiddleware, authorizeMiddleware('trainer','admin'), updateNew);
router.delete('/delete/:newId', authenticateMiddleware, authorizeMiddleware('trainer','admin'), deleteNew);

module.exports = router;
