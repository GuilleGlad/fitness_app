const pool = require('../config/db');

const listPayments = async (req, res) => {
    const { client_id, trainer_id, status, payment_method, start_date, end_date } = req.query;
    
    try {
        let query = `
            SELECT p.*, u.name as client_name, u.email as client_email, t.name as trainer_name, t.email as trainer_email
            FROM payments p
            LEFT JOIN users u ON p.client_id = u.id
            LEFT JOIN users t ON p.trainer_id = t.id
            WHERE 1=1
        `;
        const params = [];

        if (client_id) {
            query += ' AND p.client_id = ?';
            params.push(client_id);
        }
        if (trainer_id) {
            query += ' AND p.trainer_id = ?';
            params.push(trainer_id);
        }
        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }
        if (payment_method) {
            query += ' AND p.payment_method = ?';
            params.push(payment_method);
        }
        if (start_date) {
            query += ' AND DATE(p.payment_date) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            query += ' AND DATE(p.payment_date) <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY p.payment_date DESC';

        const [rows] = await pool.execute(query, params);
        
        return res.status(200).json({
            message: "Listado de pagos",
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
};

const getPayment = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ message: "ID del pago es necesario." });
    }

    try {
        const [rows] = await pool.execute(`
            SELECT p.*, u.name as client_name, u.email as client_email, t.name as trainer_name, t.email as trainer_email
            FROM payments p
            LEFT JOIN users u ON p.client_id = u.id
            LEFT JOIN users t ON p.trainer_id = t.id
            WHERE p.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Pago no encontrado." });
        }

        return res.status(200).json({
            message: "Pago encontrado",
            data: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
};

const createPayment = async (req, res) => {
    const { client_id, trainer_id, amount, status, payment_method, period_covered } = req.body;
    const normalizedClientId = parseInt(client_id, 10);
    const normalizedTrainerId = parseInt(trainer_id, 10);
    
    if (!client_id || !trainer_id || !amount || !payment_method || !period_covered) {
        return res.status(400).json({ 
            message: "Faltan campos requeridos: client_id, trainer_id, amount, payment_method, period_covered" 
        });
    }

    if (Number.isNaN(normalizedClientId) || normalizedClientId <= 0) {
        return res.status(400).json({ message: "El client_id debe ser un ID válido." });
    }

    if (Number.isNaN(normalizedTrainerId) || normalizedTrainerId <= 0) {
        return res.status(400).json({ message: "El trainer_id debe ser un ID válido." });
    }

    // Validar que el amount sea un número válido
    if (isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "El monto debe ser un número mayor a 0." });
    }

    // Validar payment_method
    const validPaymentMethods = ['Zelle', 'Transferencia', 'Efectivo'];
    if (!validPaymentMethods.includes(payment_method)) {
        return res.status(400).json({ 
            message: "Método de pago inválido. Debe ser: Zelle, Transferencia o Efectivo" 
        });
    }

    // Validar status si se proporciona
    const validStatuses = ['Pendiente', 'Aprobado', 'Rechazado'];
    const paymentStatus = status || 'Pendiente';
    if (!validStatuses.includes(paymentStatus)) {
        return res.status(400).json({ 
            message: "Estado inválido. Debe ser: Pendiente, Aprobado o Rechazado" 
        });
    }

    // Construir URL de la imagen si se subió un archivo
    const receiptFile = req.file;
    const receipt_image_url = receiptFile
        ? `${req.protocol}://${req.get('host')}/uploads/${receiptFile.filename}`
        : null;

    try {
        const [result] = await pool.execute(
            `INSERT INTO payments (client_id, trainer_id, amount, receipt_image_url, status, payment_method, period_covered) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [normalizedClientId, normalizedTrainerId, amount, receipt_image_url, paymentStatus, payment_method, period_covered]
        );

        const insert_id = result.insertId;
        
        // Obtener el pago creado con información del cliente
        const [rows] = await pool.execute(`
            SELECT p.*, u.name as client_name, u.email as client_email, t.name as trainer_name, t.email as trainer_email
            FROM payments p
            LEFT JOIN users u ON p.client_id = u.id
            LEFT JOIN users t ON p.trainer_id = t.id
            WHERE p.id = ?
        `, [insert_id]);

        return res.status(201).json({
            message: "Pago creado correctamente",
            data: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
};

const updatePayment = async (req, res) => {
    const { id } = req.params;
    const { client_id, trainer_id, amount, status, payment_method, period_covered } = req.body;
    
    if (!id) {
        return res.status(400).json({ message: "ID del pago es necesario." });
    }

    // Validar amount si se proporciona
    if (amount !== undefined && (isNaN(amount) || parseFloat(amount) <= 0)) {
        return res.status(400).json({ message: "El monto debe ser un número mayor a 0." });
    }

    // Validar payment_method si se proporciona
    if (payment_method) {
        const validPaymentMethods = ['Zelle', 'Transferencia', 'Efectivo'];
        if (!validPaymentMethods.includes(payment_method)) {
            return res.status(400).json({ 
                message: "Método de pago inválido. Debe ser: Zelle, Transferencia o Efectivo" 
            });
        }
    }

    // Validar status si se proporciona
    if (status) {
        const validStatuses = ['Pendiente', 'Aprobado', 'Rechazado'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: "Estado inválido. Debe ser: Pendiente, Aprobado o Rechazado" 
            });
        }
    }

    try {
        // Construir query dinámicamente
        const updates = [];
        const params = [];

        if (client_id !== undefined) {
            const normalizedClientId = parseInt(client_id, 10);
            if (Number.isNaN(normalizedClientId) || normalizedClientId <= 0) {
                return res.status(400).json({ message: "El client_id debe ser un ID válido." });
            }
            updates.push('client_id = ?');
            params.push(normalizedClientId);
        }
        if (trainer_id !== undefined) {
            const normalizedTrainerId = parseInt(trainer_id, 10);
            if (Number.isNaN(normalizedTrainerId) || normalizedTrainerId <= 0) {
                return res.status(400).json({ message: "El trainer_id debe ser un ID válido." });
            }
            updates.push('trainer_id = ?');
            params.push(normalizedTrainerId);
        }
        if (amount !== undefined) {
            updates.push('amount = ?');
            params.push(amount);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }
        if (payment_method !== undefined) {
            updates.push('payment_method = ?');
            params.push(payment_method);
        }
        if (period_covered !== undefined) {
            updates.push('period_covered = ?');
            params.push(period_covered);
        }

        // Manejar upload de imagen si se proporciona
        const receiptFile = req.file;
        if (receiptFile) {
            updates.push('receipt_image_url = ?');
            params.push(`${req.protocol}://${req.get('host')}/uploads/${receiptFile.filename}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: "No hay campos para actualizar." });
        }

        params.push(id);
        const query = `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`;
        
        const [result] = await pool.execute(query, params);
        const affectedRows = result.affectedRows;

        if (affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el pago con el ID proporcionado." });
        }

        // Obtener el pago actualizado
        const [rows] = await pool.execute(`
            SELECT p.*, u.name as client_name, u.email as client_email, t.name as trainer_name, t.email as trainer_email
            FROM payments p
            LEFT JOIN users u ON p.client_id = u.id
            LEFT JOIN users t ON p.trainer_id = t.id
            WHERE p.id = ?
        `, [id]);

        return res.status(200).json({
            message: "Pago actualizado correctamente",
            data: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
};

const updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id) {
        return res.status(400).json({ message: "ID del pago es necesario." });
    }

    if (!status) {
        return res.status(400).json({ message: "El estado es requerido." });
    }

    const validStatuses = ['Pendiente', 'Aprobado', 'Rechazado'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            message: "Estado inválido. Debe ser: Pendiente, Aprobado o Rechazado" 
        });
    }

    try {
        const [result] = await pool.execute(
            'UPDATE payments SET status = ? WHERE id = ?',
            [status, id]
        );

        const affectedRows = result.affectedRows;

        if (affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el pago con el ID proporcionado." });
        }

        // Obtener el pago actualizado
        const [rows] = await pool.execute(`
            SELECT p.*, u.name as client_name, u.email as client_email, t.name as trainer_name, t.email as trainer_email
            FROM payments p
            LEFT JOIN users u ON p.client_id = u.id
            LEFT JOIN users t ON p.trainer_id = t.id
            WHERE p.id = ?
        `, [id]);

        return res.status(200).json({
            message: `Estado del pago actualizado a ${status}`,
            data: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
};

const deletePayment = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ message: "ID del pago es necesario." });
    }

    try {
        const [result] = await pool.execute('DELETE FROM payments WHERE id = ?', [id]);
        const affectedRows = result.affectedRows;

        if (affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el pago con el ID proporcionado." });
        }

        return res.status(200).json({
            message: "Pago eliminado correctamente",
            affectedRows: affectedRows
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
};

const getPaymentsByClient = async (req, res) => {
    const { client_id } = req.params;
    
    if (!client_id) {
        return res.status(400).json({ message: "ID del cliente es necesario." });
    }

    try {
        const [rows] = await pool.execute(`
            SELECT p.*, u.name as client_name, u.email as client_email, t.name as trainer_name, t.email as trainer_email
            FROM payments p
            LEFT JOIN users u ON p.client_id = u.id
            LEFT JOIN users t ON p.trainer_id = t.id
            WHERE p.client_id = ?
            ORDER BY p.payment_date DESC
        `, [client_id]);

        return res.status(200).json({
            message: "Pagos del cliente",
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
};

module.exports = {
    listPayments,
    getPayment,
    createPayment,
    updatePayment,
    updatePaymentStatus,
    deletePayment,
    getPaymentsByClient
};
