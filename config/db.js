const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection()
    .then(conn => {
        console.log("✅ Conectado a la base de datos fit_sync_db");
        conn.release();
    })
    .catch(err => {
        console.error("❌ Error de conexión a la DB:", err.message);
    });

module.exports = db;