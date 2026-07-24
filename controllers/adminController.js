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

const setSettings = async (req, res) => {
    const { title, logo, gallery, ads , video, about} = req.body;

    try{
        await pool.execute("INSERT INTO settings (title,logo, gallery, ads, video_background, about) VALUES (?,?,?,?,?,?)", [title,logo, gallery, ads, video, about]);
        return res.status(200).json({
            message: "Configuración guardada"
        });

    }catch(error){
        return res.status(500).json({
            message:"Error, " + error.message
        })
    }
}

const getSettings = async (req, res) => {
    try{
        const [result] = await pool.execute("SELECT * FROM settings ORDER BY updated_at DESC LIMIT 1");
        return res.status(200).json({
            message: "Configuración",
            result: result
        });
    }catch(error){
        return res.status(500).json({
            message:"Error, " + error.message
        })
    }
}

const getCounts = async (req, res) => {
    try{
        const [clientsCount, trainersCount, newsCount, recipesCount, adsCount] = await Promise.all([
            pool.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'client' AND status = 1"),
            pool.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'trainer' AND status = 1"),
            pool.execute("SELECT COUNT(*) AS count FROM news WHERE status = 1"),
            pool.execute("SELECT COUNT(*) AS count FROM recipes WHERE is_public = 1"),
            pool.execute("SELECT CASE WHEN TRIM(COALESCE(ads, '')) = '' THEN 0 ELSE 1 + CHAR_LENGTH(ads) - CHAR_LENGTH(REPLACE(ads, ',', '')) END AS total_ads FROM settings ORDER BY updated_at DESC LIMIT 1;")            
        ]); 
        return res.status(200).json({
            message: "Conteos",
            counts: {
                clients: clientsCount[0][0].count,
                trainers: trainersCount[0][0].count,
                news: newsCount[0][0].count,
                recipes: recipesCount[0][0].count,
                ads: adsCount[0][0].total_ads
            }
        });
    }catch(error){
        return res.status(500).json({
            message:"Error, " + error.message
        })
    }
}

const getClients = async (req, res) =>{
    try{
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
        const role = token_json.role;
        console.log(role);
        if(role !== 'admin'){
            [rows] = await pool.execute("SELECT * FROM users INNER JOIN client_profiles ON client_profiles.user_id = users.id WHERE client_profiles.trainer_id = ? AND users.status = 1",[client_id]);
        }else{
            [rows] = await pool.execute("SELECT * FROM users LEFT JOIN client_profiles ON client_profiles.user_id = users.id ",[client_id]);
        }
        return res.status(200).json({
            message: "Listado de Clientes",
            clientes: rows,
        });

    }catch(error){
        res.status(500).json({
            message: "Error",
            error: error.message
        })
    }
}

const getTrainers = async(req, res) => {
    try{
        const role = "trainer";
        [rows] = await pool.execute("SELECT * FROM users WHERE role = ?",[role]);
        return res.status(200).json({
            message: "Listado de Entrenadores",
            entrenadores: rows,
        });

    }catch(error){
        res.status(500).json({
            message: "Error",
            error: error.message
        })
    }
}

const deleteUser = async(req, res) => {
    try{
        const {id} = req.params;
        await pool.execute("UPDATE users SET status = 0, deleted = 1 WHERE id = ?",[id]);
        return res.status(200).json({
            message: "Usuario Eliminado",
        });
    }catch(error){
        res.status(500).json({
            message: "Error no se puedo Eliminar el Usuario",
            error: error.message
        });
    }
}

const updateUser = async(req, res) => {
    try{
        const {id} = req.params;
        if(!id){
            return res.status(500).json({
                message: "Falta el Id del Usuario",
            });
        }
        const {email, genre, name, password, phone, role, picture = '/images/avatar.png'} = req.body;
        if(role != null){
            await pool.execute("UPDATE users SET email = ?, genre = ?, name = ?, password = ?, phone = ? , picture =  ?, role = ? WHERE id = ?",[email, genre, name, password, phone, picture, role, id]);
        }else{
            await pool.execute("UPDATE users SET email = ?, genre = ?, name = ?, password = ?, phone = ? , picture =  ? WHERE id = ?",[email, genre, name, password, phone, picture, id]);
        } 
        
        return res.status(200).json({
            message: "Usuario Actualizado",
        });
    }catch(error){
        return res.status(500).json({
            message: "Error no se pudo Actualizar el Usuario",
            error: error.message
        })
    }
}

const restoreUser = async(req, res) => {
    try{
        const {id} = req.params;
        await pool.execute("UPDATE users SET status = 0, deleted = 0 WHERE id = ?",[id]);
        return res.status(200).json({
            message: "Usuario Restaurado",
        });
    }catch(error){
        res.status(500).json({
            message: "Error no se puedo Restaurar el Usuario",
            error: error.message
        });
    }    
}


module.exports = {
    getUsers,
    getUser,
    setSettings,
    getSettings,
    getCounts,
    getClients,
    getTrainers,
    deleteUser,
    updateUser,
    restoreUser
}