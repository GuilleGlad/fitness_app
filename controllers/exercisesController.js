const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const addExercise = async (req, res) => {
    const { trainer_id, title, description, photo_url, video_url} = req.body;
    if (!trainer_id || !title || !description || !photo_url || !video_url) {
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }
    try {
        const [result] = await pool.execute("INSERT INTO exercises (trainer_id, title, description, photo_url, video_url) VALUES (?,?,?,?,?)", [trainer_id, title, description, photo_url, video_url]);
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

const updateExercise = async (req, res) => {
    const {id, trainer_id, title, description, photo_url, video_url} = req.body;
    if (!trainer_id || !title || !description || !photo_url || !video_url) {
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }
    try {
        await pool.execute("UPDATE exercises SET trainer_id = ?, title = ?, description = ?, photo_url = ?, video_url = ? WHERE id = ?", [trainer_id, title, description, photo_url, video_url, id]);
        return res.status(201).json({
            message: "Registro Actualizado",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }
}

const getExercise = async(req,res) => {
    const {id} = req.params;
    if(!id){
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    try{
        const [rows] = await pool.execute("SELECT * FROM exercises WHERE id = ?", [id]);
        console.log(rows);
        const exercises = [];
        rows.map((r) => {
            exercises.push({
                id: r.id,
                trainer_id: r.trainer_id,
                title: r.title,
                description: r.description,
                photo_url: r.photo_url,
                video_url: r.video_url
            })
        });
        return res.status(200).json({
            exercises: exercises,
        })
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        })
    }
}

module.exports = {
    addExercise,
    updateExercise,
    getExercise
}
