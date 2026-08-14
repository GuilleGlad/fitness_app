const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const addProgress = async (req, res) => {
    const { client_id, height, weight, waist, hips, arms, legs, age, training_days, goal, trainerId  } = req.body;
    const io = req.app.get("io");
    const fullUrl = req.get("origin");
    const emailService = require("../services/emailService");
    const notificationService = require("../services/notificationsService");

    if (!client_id || !height || !weight || !waist || !hips || !arms || !legs) {
        return res.status(400).json({ message: "Faltan campos necesarios para el registro." });
    }

    try {
        const photoFrontFile = req.files?.photo_front?.[0];
        const photoBackFile = req.files?.photo_back?.[0];

        const photo_front = photoFrontFile
            ? `${req.protocol}://${req.get('host')}/uploads/${photoFrontFile.filename}`
            : '';

        const photo_back = photoBackFile
            ? `${req.protocol}://${req.get('host')}/uploads/${photoBackFile.filename}`
            : '';

        const [result] = await pool.execute("INSERT INTO progress_history (client_id, weight, waist, hips, arms, legs, photo_front_url, photo_back_url) VALUES (?,?,?,?,?,?,?,?)",[client_id, weight, waist, hips, arms, legs, photo_front, photo_back]);
        const insert_id = result.insertId;

        const [rows] = await pool.execute("SELECT * FROM client_profiles WHERE user_id = ? AND trainer_id = ?",[client_id, trainerId]);
        if(rows.length == 0){
            const [result2] = await pool.execute("INSERT INTO client_profiles (user_id, trainer_id, age, height, initial_weight, training_days, goal, whatsapp_url) VALUES (?,?,?,?,?,?,?,?)",[client_id, trainerId, age, height, weight, training_days, goal, '']); 
            // const insert_id2 = result2.insertId;
        }

        const [result3] = await pool.execute("UPDATE users SET status = 1 WHERE id = ?", [client_id]);
        const affectedRows = result3.affectedRows;

        const [client_data] = await pool.execute("SELECT * FROM users WHERE id = ?",[client_id]);

        const payload = {
            message: `El cliente con nombre ${client_data[0].name}, acaba de seleccionarte como su Entrenador.`,
            destination_id: trainerId,
            source_id: client_data[0].id,
            status: 0,
            navigato_to: fullUrl + "/clients"
        }

        const data_notification = await notificationService.createNotification(payload);

        if (io) io.emit('new_notification', data_notification);

        emailService.sendNotificationEmail(data_notification).catch((error) => {
            console.error('Error enviando correo de notificación:', error.message);
        });    

        return res.status(201).json({
            message:"Registro Creado",
            id: insert_id,
            // id2: insert_id2,
            affectedRows: affectedRows
        })
    } catch (error) {
        console.error('RAW ERROR:', error);
        res.status(500).json({ message: error.message || JSON.stringify(error) });
    }
}
const listProgress = async (req,res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) 
        return res.status(401).send({msg : 'No ha ingresado un token'})
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err){
            return  
            res.status(403).send({msg : 'Token invalido'})
        }
    })
    const token_json = jwt.decode(token, process.env.TOKEN_SECRET);
    const client_id = token_json.id;
    try{
        [rows] = await pool.execute("SELECT * FROM progress_history WHERE client_id = ? ORDER BY log_date DESC",[client_id])
        return res.status(200).json({
            message:"Historial de Progreso",
            filas: rows
        })
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        })
    }
}

const getProgress = async (req,res) => {
    const {clientId} = req.params;
    if(!clientId){
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }    
    try{
        [rows] = await pool.execute("SELECT * FROM progress_history WHERE client_id = ? ORDER BY log_date DESC",[clientId])
        return res.status(200).json({
            message:"Historial de Progreso",
            filas: rows
        })
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        })
    }
}

const getProfile = async (req, res) =>{
    try{
        const SecretToken = process.env.TOKEN_SECRET;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) 
            return res.status(401).send({msg : 'No ha ingresado un token'})
        jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
            if (err){
                return  
                res.status(403).send({msg : 'Token invalido'})
            }
        })
        const token_json = jwt.decode(token, process.env.TOKEN_SECRET);
        const client_id = token_json.id;
        const role = token_json.role;
        [rows] = await pool.execute("SELECT *, trainers.name as trainer_name, trainers.phone as trainer_phone FROM client_profiles INNER JOIN users trainers ON client_profiles.trainer_id = trainers.id WHERE user_id = ? LIMIT 1",[client_id]);
        return res.status(200).json({
            message: "Perfil del Cliente",
            profile: rows,
        });

    }catch(error){
        res.status(500).json({
            message: "Error",
            error: error.message
        })
    }
}

const getProfileById = async (req, res) =>{
    try{
        const {clientId} = req.params;
        [rows] = await pool.execute("SELECT * FROM client_profiles WHERE user_id = ?",[clientId]);
        return res.status(200).json({
            message: "Perfil del Cliente",
            profile: rows,
        });

    }catch(error){
        res.status(500).json({
            message: "Error",
            error: error.message
        })
    }
}

module.exports = {
    addProgress,
    listProgress,
    getProgress,
    getProfile,
    getProfileById
}