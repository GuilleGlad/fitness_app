const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const listNotifications = async (req, res) => {
    const { status, source_id, destination_id } = req.query;
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (source_id) {
        query += ' AND source_id = ?';
        params.push(source_id);
    }
    if (destination_id) {
        query += ' AND destination_id = ?';
        params.push(destination_id);
    }

    try {
        const [rows] = await pool.execute(query, params);
        return res.status(200).json({
            message: 'Lista de notificaciones',
            data: rows
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener notificaciones: ' + error.message
        });
    }
};

const getNotification = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'ID de notificacion es necesario' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Notificacion no encontrada' });
        }

        return res.status(200).json({
            message: 'Notificacion encontrada',
            data: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener notificacion: ' + error.message
        });
    }
};

const createNotification = async (req, res) => {
    const { message, destination_id, source_id, status, navigate_to } = req.body;
    const io = req.app.get('io');

    if (!message || !destination_id || !source_id) {
        return res.status(400).json({
            message: 'Faltan campos requeridos: message, destination_id, source_id'
        });
    }

    const statusValue = status || 'new';
    const navigateValue = navigate_to || null;

    try {
        const [result] = await pool.execute(
            `INSERT INTO notifications (message, destination_id, source_id, status, navigate_to)
       VALUES (?, ?, ?, ?, ?)`,
            [message, destination_id, source_id, statusValue, navigateValue]
        );

        const newId = result.insertId;
        const [newRow] = await pool.execute(
            'SELECT * FROM notifications WHERE id = ?',
            [newId]
        );

        const notificationCreated = newRow[0];

        // Emitir el objeto completo si 'io' existe
        if (io) {
            io.emit('new_notification', notificationCreated);
        } else {
            console.warn('Socket.IO no está inicializado en app.get("io")');
        }

        return res.status(201).json({
            message: 'Notificación creada correctamente',
            data: notificationCreated
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al crear notificación: ' + error.message
        });
    }
};

const updateNotification = async (req, res) => {
    const { id } = req.params;
    const {
        message,
        destination_id,
        source_id,
        status,
        navigate_to
    } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'ID de notificacion es necesario' });
    }

    const fields = [];
    const params = [];

    if (message !== undefined) {
        fields.push('message = ?');
        params.push(message);
    }
    if (destination_id !== undefined) {
        fields.push('destination_id = ?');
        params.push(destination_id);
    }
    if (source_id !== undefined) {
        fields.push('source_id = ?');
        params.push(source_id);
    }
    if (status !== undefined) {
        fields.push('status = ?');
        params.push(status);
    }
    if (navigate_to !== undefined) {
        fields.push('navigate_to = ?');
        params.push(navigate_to);
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'Ningun campo para actualizar' });
    }

    const query = `UPDATE notifications SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    try {
        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notificacion no encontrada' });
        }

        const [updatedRow] = await pool.execute(
            'SELECT * FROM notifications WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            message: 'Notificacion actualizada correctamente',
            data: updatedRow[0]
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al actualizar notificacion: ' + error.message
        });
    }
};

const updateNotificationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'read', 'archived', 'sent', 'failed'];

    if (!id) {
        return res.status(400).json({ message: 'ID de notificacion es necesario' });
    }
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            message: 'Estado invalido. Estados validos: ' + validStatuses.join(', ')
        });
    }

    try {
        const [result] = await pool.execute(
            'UPDATE notifications SET status = ? WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notificacion no encontrada' });
        }

        const [updatedRow] = await pool.execute(
            'SELECT * FROM notifications WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            message: `Estado de notificacion actualizado a ${status}`,
            data: updatedRow[0]
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al actualizar estado: ' + error.message
        });
    }
};
const deleteNotification = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'ID de notificacion es necesario' });
    }

    try {
        const [result] = await pool.execute(
            'DELETE FROM notifications WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notificacion no encontrada' });
        }

        return res.status(200).json({
            message: 'Notificacion eliminada correctamente',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error al eliminar notificacion: ' + error.message
        });
    }
};


module.exports = {
    listNotifications,
    getNotification,
    createNotification,
    updateNotification,
    updateNotificationStatus,
    deleteNotification
};
