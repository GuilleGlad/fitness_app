const express = require('express');
const router = express.Router();
const {listNotifications, getNotification, createNotification, updateNotification, updateNotificationStatus, deleteNotification} = require('../../controllers/notificationsController');
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');

// Routes for notifications
router.get('/', authenticateMiddleware, authorizeMiddleware('admin', 'trainer', 'client'), listNotifications);
router.get('/:id', getNotification);
router.post('/', createNotification);
router.put('/:id', updateNotification);
router.patch('/:id/status', updateNotificationStatus);
router.delete('/:id', deleteNotification);

module.exports = router;
