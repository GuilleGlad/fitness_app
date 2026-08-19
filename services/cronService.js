const pool = require('../config/db');
const cron = require('node-cron');
const emailService = require('./emailService');

/**
 * Verifica si los usuarios registrados en la tabla users tienen una fila en client_profiles.
 * Si un usuario no tiene perfil de cliente, se le envía un correo para completar los datos.
 */
const checkMissingClientProfiles = async () => {
  try {
    // Obtener todos los usuarios con rol 'client' y status activo
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE role = ? AND status = 1',
      ['client']
    );

    console.log(`Verificando perfiles de ${users.length} usuarios clientes...`);

    for (const user of users) {
      // Verificar si el usuario tiene una fila en client_profiles
      const [rows] = await pool.execute(
        'SELECT * FROM client_profiles WHERE user_id = ?',
        [user.id]
      );

      // Si no hay fila de perfil, enviar correo de notificación
      if (rows.length === 0) {
        console.log(`Usuario ${user.id} (${user.email}) sin perfil de cliente. Enviando correo...`);

        // Enviar correo usando el emailService
        await emailService.sendEmail({
          to: user.email,
          subject: 'Importante: Completa tu perfil de cliente',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px;">
              <h2 style="color: #1e222b; margin-bottom: 8px;">¡Hola!</h2>
              <p style="color: #334155; font-size: 15px; line-height: 1.5;">
                Tu cuenta está registrada en EliteFit, pero aún no has completado tu perfil de cliente. 
                Para poder ofrecerte el mejor servicio de entrenamiento personalizado, necesitamos que completes 
                los siguientes datos:
              </p>
              <ul style="color: #334155; font-size: 14px; line-height: 1.5;">
                <li>Tus medidas corporales (cintura, caderas, brazos, piernas)</li>
                <li>Tu peso inicial</li>
                <li>Fotos recientes tuyo</li>
              </ul>
              <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
                Este es un correo automático de EliteFit, no respondas a este mensaje.
              </p>
            </div>
          `
        });

        console.log(`Correo enviado a ${user.email}`);
      }
    }

    console.log('Verificación de perfiles completada.');
  } catch (error) {
    console.error('Error en la verificación de perfiles:', error.message);
  }
};

/**
 * Configura el programador cron para ejecutarse diario a las 8:00 AM y 8:00 PM.
 */
const startCronScheduler = () => {
  // 8:00 AM todos los días (formato: 0 8 * * *)
  // 8:00 PM todos los días (formato: 0 20 * * *)
  const schedule = ['0 8 * * *', '0 20 * * *'];

  schedule.forEach((cronTime) => {
    cron.schedule(cronTime, async () => {
      console.log(`🕐 Ejecutando verificación de perfiles clientes (${cronTime})...`);
      await checkMissingClientProfiles();
    });

    console.log(`✅ Programador cron activado para: ${cronTime}`);
  });
};

module.exports = {
  checkMissingClientProfiles,
  startCronScheduler
};