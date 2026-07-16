const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const addNew = async (req, res) => {
    const { title, text, author, image_url  } = req.body;
    console.log(req.body);
    if (!title || !text || !author || !image_url) {
        return res.status(400).json({ message: "Faltan campos necesarios." });
    }
    try {
        const [result] = await pool.execute("INSERT INTO news (title, text, author, image_url) VALUES (?,?,?,?)",[title, text, author, image_url]);
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
const listNews = async (req,res) => {
   
    try{
        [rows] = await pool.execute("SELECT * FROM news ")
        return res.status(200).json({
            message:"Recetas",
            filas: rows
        })
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        })
    }
}

const getNew = async (req,res) => {
    const {newId} = req.params;
    if(!newId){
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }    
    try{
        [rows] = await pool.execute("SELECT * FROM news WHERE id = ?",[newId])
        return res.status(200).json({
            message:"Noticia encontrada con id "+newId,
            filas: rows
        })
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        })
    }
}

const updateNew = async (req, res) => {
    const {id, title, text, author, image_url, status} = req.body;
    if (!id || !title || !text || !author || !image_url || status === undefined) {
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }
    try {
        await pool.execute("UPDATE news SET title = ?, text = ?, author = ?, image_url = ?, status = ? WHERE id = ?", [title, text, author, image_url, status, id]);
        return res.status(201).json({
            message: "Registro Actualizado",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error: " + error.message,
        });
    }
}

const deleteNew = async(req,res) => {
    const {newId} = req.params;
    console.log(newId);
    try{
        await pool.execute("DELETE FROM news WHERE id = ?", [newId]);
        return res.status(200).json({
            message: "Noticia eliminada correctamente",
        });
    }catch(error){
        return res.status(500).json({
            message: "Error: " + error.message
        })
    }
}

module.exports = {
    addNew,
    listNews,
    getNew,
    updateNew,
    deleteNew
}