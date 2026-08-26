const pool = require('../config/db');
const notificationService = require('../services/notificationsService');
const emailService = require('../services/emailService');

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
    const io = req.app.get('io');
    const fullUrl = req.get('origin');


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
            SELECT p.*, DAY(p.payment_date) as payment_day, u.name as client_name, u.email as client_email, t.name as trainer_name, t.email as trainer_email
            FROM payments p
            LEFT JOIN users u ON p.client_id = u.id
            LEFT JOIN users t ON p.trainer_id = t.id
            WHERE p.id = ?
        `, [insert_id]);

        const [paymentCountRows] = await pool.execute(
            'SELECT COUNT(*) AS payment_count FROM payments WHERE client_id = ?',
            [normalizedClientId]
        );
        const payment_day = Number(rows[0].payment_day);

        if (Number(paymentCountRows[0].payment_count) === 1) {
            await pool.execute(
                'UPDATE client_profiles SET payment_day = ? WHERE user_id = ?',
                [payment_day, normalizedClientId]
            );
        }

        payload = {
            message: `El usuario ${rows[0].client_name} acaba de realizar un pago.`,
            destination_id: trainer_id,
            source_id: client_id,
            status: 0,
            navigate_to: fullUrl + '/trainer-payments'
        }
        const data_notification = await notificationService.createNotification(payload);

        if (io) io.emit('new_notification', data_notification);

        emailService.sendNotificationEmail(data_notification).catch((error) => {
            console.error('Error enviando correo de notificación:', error.message);
        });

        return res.status(201).json({
            message: "Pago creado correctamente",
            payment_day: payment_day,
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
    const io = req.app.get('io');
    const fullUrl = req.get('origin');

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
        const [paymentRows] = await pool.execute(`
            SELECT p.id, DATE_FORMAT(p.payment_date, '%Y-%m-%d') as payment_date_value, cp.payment_day
            FROM payments p
            LEFT JOIN client_profiles cp ON cp.user_id = p.client_id
            WHERE p.id = ?
        `, [id]);

        if (paymentRows.length === 0) {
            return res.status(404).json({ message: "No se encontró el pago con el ID proporcionado." });
        }

        const paymentRow = paymentRows[0];
        const paymentDay = Number(paymentRow.payment_day);

        let expirationDate = null;
        if (Number.isInteger(paymentDay) && paymentDay >= 1 && paymentDay <= 31) {
            // Misma lógica de ciclo usada en checkPaymentExpiration: anclada a
            // payment_date, no a "hoy", para que un pago hecho después del
            // día de corte cubra el ciclo siguiente y no el que ya pasó.
            // Se usa payment_date_value ('YYYY-MM-DD', vía DATE_FORMAT en SQL)
            // en vez de `new Date(payment_date)` para evitar que un DATETIME
            // cercano a medianoche cambie de día calendario al reinterpretarse
            // con la zona horaria del proceso Node.
            const getCyclePaymentDate = (year, month) => {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                return new Date(year, month, Math.min(paymentDay, daysInMonth));
            };

            const [payYear, payMonth, payDay] = paymentRow.payment_date_value.split('-').map(Number);
            const paymentDate = new Date(payYear, payMonth - 1, payDay);
            const currentCycleDate = getCyclePaymentDate(paymentDate.getFullYear(), paymentDate.getMonth());
            const nextCycleDate = getCyclePaymentDate(paymentDate.getFullYear(), paymentDate.getMonth() + 1);
            expirationDate = paymentDate >= currentCycleDate ? nextCycleDate : currentCycleDate;
        }

        const [result] = await pool.execute(
            'UPDATE payments SET status = ?, status_date = NOW(), expiration_date = ? WHERE id = ?',
            [status, expirationDate, id]
        );
        const affectedRows = result.affectedRows;

        if (affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el pago con el ID proporcionado." });
        }

        // Obtener el pago actualizado
        const [rows] = await pool.execute(`
            SELECT p.*, u.id as client_id, u.name as client_name, u.email as client_email, t.name as trainer_name, t.email as trainer_email
            FROM payments p
            LEFT JOIN users u ON p.client_id = u.id
            LEFT JOIN users t ON p.trainer_id = t.id
            WHERE p.id = ?
        `, [id]);

        payload = {
            message: `Hola ${rows[0].client_name}, su pago ha sido ${status}.`,
            destination_id: rows[0].client_id,
            source_id: rows[0].trainer_email,
            status: 0,
            navigate_to: fullUrl + '/login'
        }
        const data_notification = await notificationService.createNotification(payload);
        if (io) io.emit('new_notification', data_notification);

        emailService.sendNotificationEmail(data_notification).catch((error) => {
            console.error('Error enviando correo de notificación:', error.message);
        });

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

const checkPaymentExpiration = async (req, res) => {
    const { id } = req.params;
    const io = req.app.get("io");
    const fullUrl = req.get('origin');

    if (!id) {
        return res.status(400).json({ message: "ID del pago es necesario." });
    }

    try {
        // Obtener el pago con datos del cliente y su día de pago
        const [rows] = await pool.execute(`
            SELECT p.*, DATE_FORMAT(p.payment_date, '%Y-%m-%d') as payment_date_value,
                   u.name as client_name, u.email as client_email, u.id as client_id,
                   cp.payment_day
            FROM payments p
            LEFT JOIN users u ON p.client_id = u.id
            LEFT JOIN client_profiles cp ON cp.user_id = p.client_id
            WHERE p.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Pago no encontrado." });
        }

        const payment = rows[0];
        const currentDate = new Date();
        const paymentDay = Number(payment.payment_day);

        if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31) {
            return res.status(400).json({
                message: "El cliente no tiene un día de pago configurado."
            });
        }

        // ============================
        // 🔥 LÓGICA CORREGIDA (v3)
        // ============================
        // Se calcula el vencimiento anclado a LA FECHA DEL PAGO (payment_date),
        // no a "hoy". Si el pago se hizo en o después del día de pago del mes
        // en que se hizo, cubre hasta el día de pago del mes SIGUIENTE. Si se
        // hizo antes (pago adelantado), cubre hasta el día de pago de ese
        // mismo mes.
        //
        // IMPORTANTE: la fecha del pago se construye a partir de
        // payment_date_value ('YYYY-MM-DD', calculado con DATE_FORMAT en SQL)
        // y NO a partir de `new Date(payment.payment_date)`. Un DATETIME
        // reinterpretado en JS puede desplazarse a la zona horaria del
        // proceso Node y cambiar de día calendario en pagos hechos cerca de
        // medianoche (ej. 00:15 AM), mientras que payment_day (calculado con
        // DAY() en SQL) nunca sufre ese corrimiento. Usar la misma fuente
        // (SQL) para ambos evita que se desincronicen.

        const getCyclePaymentDate = (year, month) => {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            return new Date(year, month, Math.min(paymentDay, daysInMonth));
        };

        const [payYear, payMonth, payDay] = payment.payment_date_value.split('-').map(Number);
        const paymentDate = new Date(payYear, payMonth - 1, payDay);
        const currentCycleDate = getCyclePaymentDate(paymentDate.getFullYear(), paymentDate.getMonth());
        const nextCycleDate = getCyclePaymentDate(paymentDate.getFullYear(), paymentDate.getMonth() + 1);

        const expirationDate = paymentDate >= currentCycleDate ? nextCycleDate : currentCycleDate;

        const paymentData = {
            ...payment,
            expiration_date: expirationDate
        };

        // ============================
        // 🔥 DETECCIÓN DE EXPIRACIÓN
        // ============================

        if (currentDate > expirationDate) {
            // Si el pago no está marcado como expirado, actualizarlo
            if (payment.status !== 'Expirado') {
                await pool.execute(
                    'UPDATE payments SET status = ? WHERE id = ?',
                    ['Expirado', id]
                );
            }

            // Obtener datos para notificación
            const [rows2] = await pool.execute(`
                SELECT p.*, u.id as client_id, u.name as client_name, u.email as client_email,
                       t.name as trainer_name, t.email as trainer_email
                FROM payments p
                LEFT JOIN users u ON p.client_id = u.id
                LEFT JOIN users t ON p.trainer_id = t.id
                WHERE p.id = ?
            `, [id]);

            const payload = {
                message: `Hola ${rows2[0].client_name}, su mensualidad se ha vencido, debe hacer el pago para reactivar la cuenta.`,
                destination_id: rows2[0].client_id,
                source_id: 1,
                status: 0,
                navigate_to: fullUrl + '/login'
            };

            const data_notification = await notificationService.createNotification(payload);
            if (io) io.emit('new_notification', data_notification);

            emailService.sendNotificationEmail(data_notification).catch((error) => {
                console.error('Error enviando correo de notificación:', error.message);
            });

            return res.status(200).json({
                message: "El pago ha expirado",
                alert: "El pago ya expiró y debe pagar la mensualidad.",
                status_modification: true,
                data: {
                    ...paymentData,
                    status: 'Expirado'
                }
            });
        }

        // ============================
        // 🔥 PAGO VIGENTE
        // ============================

        return res.status(200).json({
            message: "Pago vigente",
            alert: "El pago está al día.",
            status_modification: false,
            data: paymentData
        });


    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
};


const checkPaymentDay = async (req, res) => {
    const clientId = Number.parseInt(req.params.client_id, 10);

    if (Number.isNaN(clientId) || clientId <= 0) {
        return res.status(400).json({ message: "El client_id debe ser un ID válido." });
    }

    try {
        const [profileRows] = await pool.execute(
            'SELECT payment_day FROM client_profiles WHERE user_id = ? LIMIT 1',
            [clientId]
        );

        if (profileRows.length === 0) {
            return res.status(404).json({ message: "Perfil del cliente no encontrado." });
        }

        const paymentDay = Number(profileRows[0].payment_day);
        if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31) {
            return res.status(400).json({
                message: "El cliente no tiene un día de pago configurado."
            });
        }

        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const getPaymentDate = (year, month) => new Date(
            year,
            month,
            Math.min(paymentDay, new Date(year, month + 1, 0).getDate())
        );
        const currentPaymentDate = getPaymentDate(today.getFullYear(), today.getMonth());
        const nextPaymentDate = getPaymentDate(today.getFullYear(), today.getMonth() + 1);
        const previousPaymentDate = getPaymentDate(today.getFullYear(), today.getMonth() - 1);
        const cycleStart = startOfDay >= currentPaymentDate ? currentPaymentDate : previousPaymentDate;
        const cycleEnd = startOfDay >= currentPaymentDate ? nextPaymentDate : currentPaymentDate;
        const toSqlDate = (date) => date.toISOString().slice(0, 10);

        const [paymentRows] = await pool.execute(`
            SELECT *
            FROM payments
            WHERE client_id = ?
              AND status IN ('Pendiente', 'Aprobado')
              AND payment_date >= ?
              AND payment_date < ?
            ORDER BY payment_date DESC
            LIMIT 1
        `, [clientId, toSqlDate(cycleStart), toSqlDate(cycleEnd)]);

        const paymentExists = paymentRows.length > 0;
        const dueDate = paymentExists && startOfDay >= currentPaymentDate
            ? nextPaymentDate
            : currentPaymentDate;
        const daysRemaining = Math.ceil((dueDate - startOfDay) / 86400000);

        if (!paymentExists && startOfDay > currentPaymentDate) {
            return res.status(200).json({
                message: "Su pago mensual está vencido",
                payment_day: paymentDay,
                days_remaining: 0,
                payment_exists: false
            });
        }

        if (daysRemaining === 0) {
            return res.status(200).json({
                message: "Hoy es el día de Pago mensual",
                payment_day: paymentDay,
                days_remaining: 0,
                payment_exists: paymentExists,
                data: paymentRows[0] || null
            });
        }

        return res.status(200).json({
            message: `Faltan ${daysRemaining} días para el día de Pago de mensualidad`,
            payment_day: paymentDay,
            days_remaining: daysRemaining,
            payment_exists: paymentExists,
            data: paymentRows[0] || null
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
    getPaymentsByClient,
    checkPaymentExpiration,
    checkPaymentDay
};
