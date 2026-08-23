const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const listLibrary = async (req, res) => {
    const { trainerId } = req.params;
    try {
        const [rows] = await pool.execute("SELECT * FROM library WHERE trainer_id = ?", [trainerId]);
        return res.status(200).json({
            message: "Libreria",
            library: rows
        });
    } catch (err) {
        return res.status(500).json({
            message: "Error: " + err.message
        });
    }
}

const addLibrary = async (req, res) => {
    const {trainerId} = req.body;
    const { title, notes } = req.body;
    if(!trainerId){
        return res.status(500).json({
            message: "Falta el codigo del entrendaor"
        });
    }

    if(req.files){
        req.files.file.map(async (f) => {
            const filename = f.filename;
            const file_path = `${req.protocol}://${req.get('host')}/library/${f.filename}`;
            const file_size = f.size;
            const file_type = f.mimetype.split('/')[0];
            try{
                const [response] = await pool.execute("INSERT INTO library (filename, file_path,file_size,file_type,trainer_id, title, notes) VALUES (?,?,?,?,?,?,?)",[filename, file_path, file_size, file_type, trainerId, title, notes?notes:null]);
                const itemId = response.insertId;
                return res.status(200).json({
                    message: "success",
                    itemId: itemId,
                    url: file_path,
                    title: title || ''
                })
            }catch(err){
                return res.status(500).json({
                    message: "Error " + err.message
                })
            }

        })
    }
  
}

// Actualiza el título / etiquetas de un elemento ya subido.
// Usado por el botón de editar en la biblioteca (PATCH /library/update/:id).
const updateLibrary = async (req, res) => {
    const { id } = req.params;
    const { title, notes } = req.body;

    if (title === undefined && notes === undefined) {
        return res.status(400).json({
            message: "Nada para actualizar: falta 'title' o 'notes' en el body"
        });
    }

    try {
        const [rows] = await pool.execute("SELECT * FROM library WHERE id = ?", [id]);
        const row = rows[0];

        if (!row) {
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        const newTitle = title !== undefined ? title : row.title;
        const newNotes = notes !== undefined ? notes : row.notes;

        await pool.execute("UPDATE library SET title = ?, notes = ? WHERE id = ?", [newTitle, newNotes, id]);

        return res.status(200).json({
            message: "success",
            itemId: id,
            title: newTitle,
            notes: newNotes
        });
    } catch (err) {
        return res.status(500).json({
            message: "Error: " + err.message
        });
    }
}

const deleteLibrary = async (req, res) => {
    const {id} = req.params;
    try{
        const [rows] = await pool.execute("SELECT * FROM library WHERE id = ?", [id]);
        const row = rows[0];

        if (!row) {
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        const filename = row.filename;
        if (filename) {
            const filePath = path.join(__dirname, '../library', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await pool.execute("DELETE FROM library WHERE id = ?", [id]);

        return res.status(200).json({
            message: "success"
        });
    } catch(err) {
        return res.status(500).json({
            message: err.message
        });
    }
}

module.exports = {
    listLibrary,
    addLibrary,
    updateLibrary,
    deleteLibrary,
}