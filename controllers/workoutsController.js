const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { cleanURL } = require('../lib/utils');

const listByTrainer = async (req, res) => {
    const { trainer_id } = req.params;
    if (!trainer_id) {
        return res.status(400).json({ message: "ID del entrenador es necesario." });
    }
    try {
        const [rows] = await pool.execute("SELECT workout_items.id as workout_id, workout_items.exercise_id, workout_items.sets, workout_items.reps_text, workout_items.client_effort_notes, exercises.trainer_id, exercises.title, exercises.description, exercises.photo_url, exercises.video_url, exercises.publico FROM workout_items INNER JOIN exercises ON workout_items.exercise_id = exercises.id WHERE trainer_id = ?", [trainer_id]);
        return res.status(200).json({
            message: "Listado de Entrenamientos",
            filas: rows,
        });
    } catch (error) {
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
        const [rows] = await pool.execute("SELECT daily_workouts.id, daily_workouts.client_id, daily_workouts.workout_id, daily_workouts.day_of_week, daily_workouts.trainer_notes, daily_workouts.log_date, workout_items.exercise_id, workout_items.sets, workout_items.reps_text, workout_items.client_effort_notes, users.id AS user_id, users.name, users.email, users.role, users.created_at, users.status, users.genre, users.phone, users.picture, users.deleted, exercises.title, workout_note.id as workout_note_id, workout_note.note, workout_note.feedback, workout_note.status FROM daily_workouts INNER JOIN workout_items ON daily_workouts.workout_id = workout_items.id INNER JOIN users ON daily_workouts.client_id = users.id INNER JOIN exercises ON exercises.id = workout_items.exercise_id LEFT JOIN workout_note ON workout_note.client_id = daily_workouts.client_id AND workout_note.daily_workouts_id = daily_workouts.id AND DATE(workout_note.log_date) = DATE(daily_workouts.log_date) WHERE daily_workouts.client_id = ? ORDER BY daily_workouts.id DESC", [client_id]);
        return res.status(200).json({
            message: "Lista de Entrenamientos",
            filas: rows
        });
    } catch (error) {
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

const addNoteToWorkout = async (req, res) => {
    const { client_id, daily_workouts_id, log_date, note } = req.body;

    if (!client_id || !daily_workouts_id || !log_date) {
        return res.status(400).json({ message: "Faltan campos requeridos: client_id, daily_workouts_id, log_date, note" });
    }

    try {
        // Verificar si ya existe un registro con los mismos client_id, daily_workouts_id y log_date
        const [existing] = await pool.execute(
            "SELECT id FROM workout_note WHERE client_id = ? AND daily_workouts_id = ?",
            [client_id, daily_workouts_id]
        );

        if (existing.length > 0) {
            // Actualizar el registro existente
            const [result] = await pool.execute(
                "UPDATE workout_note SET note = ? WHERE client_id = ? AND daily_workouts_id = ? ",
                [note, client_id, daily_workouts_id]
            );

            return res.status(200).json({
                message: "Nota actualizada correctamente",
                updated: true,
                affectedRows: result.affectedRows
            });
        } else {
            // Insertar nuevo registro
            const [result] = await pool.execute(
                "INSERT INTO workout_note (note, daily_workouts_id, client_id, log_date) VALUES (?, ?, ?, ?)",
                [note, daily_workouts_id, client_id, log_date]
            );

            return res.status(201).json({
                message: "Nota creada correctamente",
                created: true,
                insert_id: result.insertId
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }
}

const getWorkoutNote = async (req, res) => {
    const { client_id, daily_workouts_id, log_date } = req.query;

    if (!client_id || !daily_workouts_id || !log_date) {
        return res.status(400).json({ message: "Faltan parámetros requeridos: client_id, daily_workouts_id, log_date" });
    }

    try {
        const [rows] = await pool.execute(
            "SELECT * FROM workout_note WHERE client_id = ? AND daily_workouts_id = ? AND log_date = ?",
            [client_id, daily_workouts_id, log_date]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Nota no encontrada" });
        }

        return res.status(200).json({
            message: "Nota encontrada",
            data: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }
}

const getWorkoutNoteById = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Faltan el parámetro requerido: ID" });
    }

    try {
        const [rows] = await pool.execute(
            "SELECT * FROM workout_note WHERE id = ?", [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Nota no encontrada" });
        }

        return res.status(200).json({
            message: "Nota encontrada",
            data: rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }

}
const updateNoteFeedback = async (req, res) => {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!id) {
        return res.status(400).json({ message: "El ID de la nota es necesario." });
    }
    if (feedback === undefined || feedback === null) {
        return res.status(400).json({ message: "Faltan campos requeridos: feedback" });
    }

    try {
        // Verificamos que la nota exista antes de actualizar
        const [rows] = await pool.execute("SELECT id FROM workout_note WHERE id = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "No se encontró la nota con el ID proporcionado." });
        }

        // Actualizamos solo el campo feedback
        const [result] = await pool.execute("UPDATE workout_note SET feedback = ?, status = 1 WHERE id = ?", [feedback, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se pudo actualizar el feedback." });
        }

        return res.status(200).json({
            message: "Feedback guardado correctamente",
            affectedRows: result.affectedRows
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }
};
module.exports = {
    listByClient,
    assignWorkout,
    deassignWorkout,
    updateDailyWorkout,
    listByTrainer,
    addWorkout,
    deleteWorkout,
    updateWorkout,
    addNoteToWorkout,
    getWorkoutNote,
    getWorkoutNoteById,
    updateNoteFeedback
}
