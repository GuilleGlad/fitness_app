const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const getUsers = async (req, res) => {
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
        const [result] = await pool.execute("SELECT * FROM users WHERE status = 1")
        return res.status(200).json({
            message: "Usuarios",
            result: result
        })
    }catch(error){
        return res.status(500).json({
            message:"Error, " + error.message
        })
    }
}

const getUser = async (req, res) => {
    const {id} = req.params;
    if(!id){
        return res.status(401).send({msg : 'Faltan campos'})
    }
    try{
        const [result] = await pool.execute("SELECT * FROM users WHERE status = 1 AND id = ?", [id])
        return res.status(200).json({
            message: "Usuario",
            result: result
        })
    }catch(error){
        return res.status(500).json({
            message:"Error, " + error.message
        })
    }
}

module.exports = {
    getUsers,
    getUser
}