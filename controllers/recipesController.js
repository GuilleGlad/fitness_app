const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const addRecipe = async (req, res) => {
    const { trainer_id, title, ingredients, instructions, image_url, is_public  } = req.body;
    if (!trainer_id || !title || !ingredients || !instructions || !image_url || !is_public) {
        return res.status(400).json({ message: "Faltan campos necesarios para el registro." });
    }
    try {
        const [result] = await pool.execute("INSERT INTO recipes (trainer_id, title, ingredients, instructions, image_url, is_public) VALUES (?,?,?,?,?,?)",[trainer_id, title, ingredients, instructions, image_url, is_public]);
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
const listRecipes = async (req,res) => {
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
    console.log(client_id);
    try{
        [rows] = await pool.execute("SELECT * FROM recipes WHERE trainer_id = ?",[client_id])
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

const getRecipe = async (req,res) => {
    const {recipeId} = req.params;
    if(!recipeId){
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }    
    try{
        [rows] = await pool.execute("SELECT * FROM recipes WHERE id = ?",[recipeId])
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
    addRecipe,
    listRecipes,
    getRecipe
}