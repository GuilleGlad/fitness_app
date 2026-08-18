const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const authenticateMiddleware = require('../../middlewares/authMiddleware');
const authorizeMiddleware = require('../../middlewares/roleMiddleware');
const { 
    listPayments, 
    getPayment, 
    createPayment, 
    updatePayment, 
    updatePaymentStatus, 
    deletePayment, 
    getPaymentsByClient,
    checkPaymentExpiration
} = require('../../controllers/paymentsController');

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

// PAYMENTS - /payments

// Listar pagos con filtros opcionales (trainer, admin pueden ver todos, client solo los suyos)
router.get('/', authenticateMiddleware, authorizeMiddleware('trainer', 'admin', 'client'), listPayments);

// Obtener pagos de un cliente específico
router.get('/client/:client_id', authenticateMiddleware, authorizeMiddleware('trainer', 'admin', 'client'), getPaymentsByClient);

// Obtener un pago por ID
router.get('/:id', authenticateMiddleware, authorizeMiddleware('trainer', 'admin', 'client'), getPayment);

// Crear un nuevo pago (trainer, admin) - con upload de imagen de comprobante
router.post('/', authenticateMiddleware, authorizeMiddleware('client'), upload.single('receipt_image_url'), createPayment);

// Actualizar un pago completo (trainer, admin) - con upload opcional de imagen
router.put('/:id', authenticateMiddleware, authorizeMiddleware('trainer', 'admin'), upload.single('receipt_image'), updatePayment);

// Actualizar solo el estado del pago (trainer, admin)
router.patch('/:id/status', authenticateMiddleware, authorizeMiddleware('trainer', 'admin'), updatePaymentStatus);

// Eliminar un pago (trainer, admin)
router.delete('/:id', authenticateMiddleware, authorizeMiddleware('trainer', 'admin'), deletePayment);

// Verificar expiración de un pago (trainer, admin, client)
router.get('/:id/check-expiration', authenticateMiddleware, authorizeMiddleware('trainer', 'admin', 'client'), checkPaymentExpiration);

module.exports = router;
