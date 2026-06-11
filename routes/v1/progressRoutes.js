const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const {addProgress, listProgress, getProgress} = require('../../controllers/progressController');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const fileName = `${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage });

//PLANS - /progress
router.post('/add', authenticateMiddleware, authorizeMiddleware('client'), upload.fields([
    { name: 'photo_front', maxCount: 1 },
    { name: 'photo_back', maxCount: 1 }
]), addProgress);
router.get('/list', authenticateMiddleware, authorizeMiddleware('client', 'trainer'), listProgress);
router.get('/get/:clientId', authenticateMiddleware, authorizeMiddleware('trainer', 'admin'), getProgress);
module.exports = router;




