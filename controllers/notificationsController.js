const notificationService = require('../services/notificationsService');
const emailService = require('../services/emailService');

const listNotifications = async (req, res) => {
    try {
        const data = await notificationService.listNotifications(req.query);
        res.status(200).json({ message: 'Lista de notificaciones', data });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
};

const getNotification = async (req, res) => {
    const { id } = req.params;

    try {
        const data = await notificationService.getNotification(id);
        if (!data) {
            return res.status(404).json({ message: 'Notificación no encontrada' });
        }

        res.status(200).json({ message: 'Notificación encontrada', data });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
};

const createNotification = async (req, res) => {
    const io = req.app.get('io');

    try {
        const data = await notificationService.createNotification(req.body);

        if (io) io.emit('new_notification', data);

        // No se espera (await) el envío del correo para no retrasar la respuesta
        // al cliente. Si falla, se registra el error pero no afecta la creación
        // de la notificación.
        emailService.sendNotificationEmail(data).catch((error) => {
            console.error('Error enviando correo de notificación:', error.message);
        });

        res.status(201).json({ message: 'Notificación creada correctamente', data });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
};

const updateNotification = async (req, res) => {
    const { id } = req.params;

    try {
        const data = await notificationService.updateNotification(id, req.body);

        if (!data) {
            return res.status(404).json({ message: 'Notificación no encontrada o sin cambios' });
        }

        res.status(200).json({ message: 'Notificación actualizada correctamente', data });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
};

const updateNotificationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['0', '1'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: 'Estado inválido. Estados válidos: ' + validStatuses.join(', ')
        });
    }

    try {
        const data = await notificationService.updateNotificationStatus(id, status);

        if (!data) {
            return res.status(404).json({ message: 'Notificación no encontrada' });
        }

        res.status(200).json({
            message: `Estado de notificación actualizado a ${status}`,
            data
        });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
};

const updateNotificationsStatusBulk = async (req, res) => {
    const { ids, status } = req.body;

    const validStatuses = ['0', '1'];

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Debe enviar un arreglo "ids" con al menos un id' });
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: 'Estado inválido. Estados válidos: ' + validStatuses.join(', ')
        });
    }

    try {
        const data = await notificationService.updateNotificationsStatusBulk(ids, status);

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'No se encontraron notificaciones para actualizar' });
        }

        res.status(200).json({
            message: `Estado actualizado a ${status} en ${data.length} notificación(es)`,
            data
        });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
};

const deleteNotification = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await notificationService.deleteNotification(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Notificación no encontrada' });
        }

        res.status(200).json({ message: 'Notificación eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
};

module.exports = {
    listNotifications,
    getNotification,
    createNotification,
    updateNotification,
    updateNotificationStatus,
    updateNotificationsStatusBulk,
    deleteNotification
};
