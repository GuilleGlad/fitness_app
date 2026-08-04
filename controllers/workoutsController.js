const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { cleanURL } = require('../lib/utils');

const listByTrainer = async (req, res) => {
    const { trainer_id } = req.params;
    if (!trainer_id) {
        return res.status(400).json({ message: "ID del entrenador es necesario." });
    }
    try{
        const [rows] = await pool.execute("SELECT workout_items.id as workout_id, workout_items.exercise_id, workout_items.sets, workout_items.reps_text, workout_items.client_effort_notes, exercises.trainer_id, exercises.title, exercises.description, exercises.photo_url, exercises.video_url, exercises.publico FROM workout_items INNER JOIN exercises ON workout_items.exercise_id = exercises.id WHERE trainer_id = ?",[trainer_id]);
        return res.status(200).json({
            message: "Listado de Entrenamientos",
            filas: rows,
        });
    }  catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
}

const addWorkout = async (req, res) => {
    const { exercise_id, sets, reps, client_effort_notes } = req.body;
    if (!exercise_id || !sets || !reps) {
        return res.status(400).json({ message: "Faltan campos requeridos." });
    }
    try {
        const [result] = await pool.execute("INSERT INTO workout_items (exercise_id, sets, reps_text, client_effort_notes) VALUES (?,?,?,?)", [exercise_id, sets, reps, client_effort_notes]);
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

const deleteWorkout = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: "ID del entrenamiento es necesario." });
    }
    try {
        const [result] = await pool.execute("DELETE FROM workout_items WHERE id = ?", [id]);
        const affectedRows = result.affectedRows;
        if (affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el entrenamiento con el ID proporcionado." });
        }
        return res.status(200).json({
            message: "Registro Eliminado",
            affectedRows: affectedRows
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }   
}

const updateWorkout = async (req, res) => {
    const { id } = req.params;
    const { exercise_id, sets, reps, client_effort_notes } = req.body;
    if (!id || !exercise_id || !sets || !reps) {
        return res.status(400).json({ message: "Faltan campos requeridos." });
    }
    try {
        const [result] = await pool.execute("UPDATE workout_items SET exercise_id = ?, sets = ?, reps_text = ?, client_effort_notes = ? WHERE id = ?", [exercise_id, sets, reps, client_effort_notes, id]);
        const affectedRows = result.affectedRows;
        if (affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el entrenamiento con el ID proporcionado." });
        }
        return res.status(200).json({
            message: "Registro Actualizado",
            affectedRows: affectedRows
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }
}

const listByClient = async (req, res) => {
    const { client_id } = req.params;
    if (!client_id) {
        return res.status(400).json({ message: "ID del cliente es necesario." });
    }
    try {
        const [rows] = await pool.execute("SELECT * FROM daily_workouts INNER JOIN workout_items ON daily_workouts.workout_id = workout_items.id INNER JOIN users ON daily_workouts.client_id = users.id WHERE daily_workouts.client_id = ? ORDER BY daily_workouts.id DESC", [client_id]);
        return res.status(200).json({
            message: "Lista de Entrenamientos",
            filas: rows
        });
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        });
    }
}

const assignWorkout = async (req, res) => {
    const { client_id, workout_id, day_of_week, trainer_notes } = req.body;
    if (!client_id || !workout_id || !day_of_week) {
        return res.status(400).json({ message: "Faltan campos requeridos." });
    }
    try {
        const [result] = await pool.execute("INSERT INTO daily_workouts (client_id, workout_id, day_of_week, trainer_notes) VALUES (?,?,?,?)", [client_id, workout_id, day_of_week, trainer_notes]);
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

const deassignWorkout = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: "ID del entrenamiento es necesario." });
    }
    try {
        const [result] = await pool.execute("DELETE FROM daily_workouts WHERE id = ?", [id]);
        const affectedRows = result.affectedRows; 
        if (affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el entrenamiento con el ID proporcionado." });
        }
        return res.status(200).json({
            message: "Registro Eliminado",
            affectedRows: affectedRows
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }       
}

const updateDailyWorkout = async (req, res) => {
    const { id } = req.params;
    const { client_id, workout_id, day_of_week, trainer_notes } = req.body;
    if (!id || !client_id || !workout_id || !day_of_week) {
        return res.status(400).json({ message: "Faltan campos requeridos." });
    }
    try {
        const [result] = await pool.execute("UPDATE daily_workouts SET client_id = ?, workout_id = ?, day_of_week = ?, trainer_notes = ? WHERE id = ?", [client_id, workout_id, day_of_week, trainer_notes, id]);
        const affectedRows = result.affectedRows;
        if (affectedRows === 0) {
            return res.status(404).json({ message: "No se encontró el entrenamiento con el ID proporcionado." });
        }
        return res.status(200).json({
            message: "Registro Actualizado",
            affectedRows: affectedRows
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }   
}

module.exports = {
    listByClient,
    assignWorkout,
    deassignWorkout,
    updateDailyWorkout,
    listByTrainer,
    addWorkout,
    deleteWorkout,
    updateWorkout
}