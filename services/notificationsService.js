const pool = require('../config/db');

exports.listNotifications = async ({ status, source_id, destination_id }) => {
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

    const [rows] = await pool.execute(query, params);
    return rows;
};

exports.getNotification = async (id) => {
    const [rows] = await pool.execute(
        'SELECT * FROM notifications WHERE id = ?',
        [id]
    );
    return rows[0] || null;
};

exports.createNotification = async ({ message, destination_id, source_id, status, navigate_to }) => {
    const statusValue = status || 'new';
    const navigateValue = navigate_to || null;

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

    return newRow[0];
};

exports.updateNotification = async (id, fields) => {
    const updates = [];
    const params = [];

    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
            updates.push(`${key} = ?`);
            params.push(value);
        }
    });

    if (updates.length === 0) return null;

    const query = `UPDATE notifications SET ${updates.join(', ')} WHERE id = ?`;
    params.push(id);

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) return null;

    const [updatedRow] = await pool.execute(
        'SELECT * FROM notifications WHERE id = ?',
        [id]
    );

    return updatedRow[0];
};

exports.updateNotificationStatus = async (id, status) => {
    const [result] = await pool.execute(
        'UPDATE notifications SET status = ? WHERE id = ?',
        [status, id]
    );

    if (result.affectedRows === 0) return null;

    const [updatedRow] = await pool.execute(
        'SELECT * FROM notifications WHERE id = ?',
        [id]
    );

    return updatedRow[0];
};

exports.updateNotificationsStatusBulk = async (ids, status) => {
    if (!Array.isArray(ids) || ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(', ');

    const [result] = await pool.execute(
        `UPDATE notifications SET status = ? WHERE id IN (${placeholders})`,
        [status, ...ids]
    );

    if (result.affectedRows === 0) return [];

    const [updatedRows] = await pool.execute(
        `SELECT * FROM notifications WHERE id IN (${placeholders})`,
        ids
    );

    return updatedRows;
};

exports.deleteNotification = async (id) => {
    const [result] = await pool.execute(
        'DELETE FROM notifications WHERE id = ?',
        [id]
    );

    return result.affectedRows > 0;
};
