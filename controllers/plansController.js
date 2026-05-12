const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const addPlans = async (req, res) => {
    const { client_id, day_of_week, trainer_notes } = req.body;
    if (!client_id || !day_of_week || !trainer_notes) {
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }
    try {
        const [result] = await pool.execute("INSERT INTO daily_workouts (client_id, day_of_week, trainer_notes) VALUES (?,?,?)", [client_id, day_of_week, trainer_notes]);
        const insert_id = result.insertId;
        return res.status(201).json({
            message: "Registro Creado",
            insert_id: insert_id
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }
}

const getPlan = async (req, res) => {
    const {planId} = req.params;
    if(!planId){
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }
    try{
        const [rows] = await pool.execute("SELECT * FROM daily_workouts WHERE id = ?",[planId]);
        if(rows.length === 0){
            return res.status(500).json({
                message: "Error: Registro no encontrado.",
            });
        }
        const workout = {
            client_id: rows[0].client_id,
            day_of_week: rows[0].day_of_week,
            trainer_notes: rows[0].trainer_notes
        }
        return res.status(200).json({
            message: "Plan Encontrado",
            daily_workout : workout
        })
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }
}

const getMyPlans = async(req,res) => {
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
    try{
        const [rows] = await pool.execute("SELECT * FROM daily_workouts WHERE client_id = ?", [client_id]);
        if(rows.length === 0){
            return res.status(500).json({
                message: "No hay resultados.",
            });
        }
        const workouts = [];
        rows.map((m) => {
            workouts.push({
                id: m.id,
                client_id: m.client_id,
                day_of_week: m.day_of_week,
                trainer_notes: m.trainer_notes
            });
        })
        return res.status(200).json({
            message:"Resultado",
            plans: workouts
        });
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }
}

module.exports = {
    addPlans,
    getPlan,
    getMyPlans
}