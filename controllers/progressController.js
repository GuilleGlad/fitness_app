const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const addProgress = async (req, res) => {
    const { client_id, weight, waist, hips, arms, legs, photo_front_url, photo_back_url } = req.body;
    if (!client_id || !weight || !waist || !hips || !arms || !legs) {
        return res.status(400).json({ message: "Faltan campos necesarios para el registro." });
    }
    try {
        var photo_front = "";
        var photo_back = "";
        if(photo_front_url)
        {
            photo_front = photo_front_url;
        }
        if(photo_back_url){
            photo_back = photo_back_url;
        }
        const [result] = await pool.execute("INSERT INTO progress_history (client_id, weight, waist, hips, arms, legs, photo_front_url, photo_back_url) VALUES (?,?,?,?,?,?,?,?)",[client_id, weight, waist, hips, arms, legs, photo_front, photo_back]);
        insert_id = result.insert_id;

        return res.status(201).json({
            message:"Registro Creado",
            id: insert_id
        })
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
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
module.exports = {
    addProgress,
    listProgress,
    getProgress
}