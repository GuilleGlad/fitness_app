const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const addExercise = async (req, res) => {
    const { trainer_id, title, description, photo_url, video_url} = req.body;
    let photoUrl = '';
    let videoUrl = '';
    if (!trainer_id || !title || !description) {
        return res.status(400).json({ message: "Faltan campos requeridos." });
    }
    if(photo_url){
        photoUrl = `${req.protocol}://${req.get('host')}/uploads/${photo_url}`;
    }
    if(video_url){
        videoUrl = `${req.protocol}://${req.get('host')}/uploads/${video_url}`;
    }
    try {
        const [result] = await pool.execute("INSERT INTO exercises (trainer_id, title, description, photo_url, video_url) VALUES (?,?,?,?,?)", [trainer_id, title, description, photoUrl, videoUrl]);
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
const getExercises = async(req,res) => {
    const {trainerId} = req.params;
    try{
        const [rows] = await pool.execute("SELECT * FROM exercises WHERE trainer_id = ?", [trainerId]);
        console.log(rows);
        return res.status(200).json({
            exercises: rows,
        })

    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        })
    }
}
const deleteExercise = async(req,res) => {
    const {id} = req.params;
    try{
        await pool.execute("DELETE FROM exercises WHERE id = ?", [id]);
        return res.status(200).json({
            message: "Ejercicio eliminado correctamente",
        });
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        })
    }
}

module.exports = {
    addExercise,
    updateExercise,
    getExercise,
    getExercises,
    deleteExercise,
}
