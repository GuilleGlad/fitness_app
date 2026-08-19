const { Resend } = require('resend');
const pool = require('../config/db');

const resend = new Resend(process.env.RESEND_API_KEY);

// Correo verificado en tu cuenta de Resend (o dominio propio verificado).
// En modo de prueba (sin dominio verificado) Resend solo te deja mandar
// al correo con el que te registraste; para producción verifica tu dominio.
const FROM_EMAIL = process.env.EMAIL_FROM || 'EliteFit <onboarding@resend.dev>';

/**
 * Envío genérico de un correo. Cualquier otro flujo (bienvenida,
 * recuperación de contraseña, recibos, etc.) puede reutilizar esta función.
 */
const sendEmail = async ({ to, subject, html }) => {
    if (!to) {
        console.warn('sendEmail: no se especificó destinatario, se omite el envío');
        return null;
    }

    const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
    });

    if (error) {
        throw new Error(error.message || 'Error enviando correo con Resend');
    }

    return data;
};

/**
 * Busca el email del usuario destino en la tabla `users`.
 * Ajusta el nombre de la tabla/columna si tu esquema difiere.
 */
const getUserEmail = async (userId) => {
    if (!userId) return null;

    const [rows] = await pool.execute(
        'SELECT email FROM users WHERE id = ?',
        [userId]
    );

    return rows[0]?.email || null;
};

/**
 * Arma y envía el correo correspondiente a una notificación recién creada.
 * Se usa desde notificationsController.createNotification, en paralelo
 * al evento de socket, sin bloquear la respuesta HTTP.
 */
const sendNotificationEmail = async (notification) => {
    const toEmail = await getUserEmail(notification.destination_id);
    console.log(toEmail);

    if (!toEmail) {
        console.warn(`sendNotificationEmail: usuario ${notification.destination_id} sin email registrado, se omite el correo`);
        return null;
    }

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px;">
            <h2 style="color: #1e222b; margin-bottom: 8px;">Tienes una nueva notificación</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">${notification.message}</p>
            <a href=${notification.navigate_to}>Ir al sitio</a>
            <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
                Este es un correo automático de EliteFit, no respondas a este mensaje.
            </p>
        </div>
    `;

    return sendEmail({
        to: toEmail,
        subject: 'Nueva notificación en EliteFit',
        html,
    });
};

module.exports = {
    sendEmail,
    sendNotificationEmail,
};
