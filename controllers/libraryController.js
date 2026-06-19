const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
            // const title = "";
            // const notes = "";
            try{
                const [response] = await pool.execute("INSERT INTO library (filename, file_path,file_size,file_type,trainer_id) VALUES (?,?,?,?,?)",[filename, file_path, file_size, file_type, trainerId]);
                return res.status(200).json({
                    data: response.data,
                    message: "success"
                })
            }catch(err){
                return res.status(500).json({
                    message: "Error " + err.message
                })
            }

        })
    }
  
}

// const deleteLibrary = async (req, res) => {
//     const [id] = req.body;
//     try{
//         const [response] = await pool.execute("DELETE")
//     }
// }
module.exports = {
    listLibrary,
    addLibrary,
}