const express = require('express');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { listLibrary,addLibrary, deleteLibrary } = require('../../controllers/libraryController');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../library/');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const fileName = `${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, fileName);
    }
});

const upload = multer({ storage });

//LIBRARY /library
router.get('/list/:trainerId', authenticateMiddleware, authorizeMiddleware('admin', 'trainer'), listLibrary);
router.post('/add', authenticateMiddleware, authorizeMiddleware('admin', 'trainer'), upload.fields([
    { name: 'file', maxCount: 1 }
]), addLibrary)
router.delete('/delete/:id', authenticateMiddleware, authorizeMiddleware('admin','trainer'), deleteLibrary);

module.exports = router;