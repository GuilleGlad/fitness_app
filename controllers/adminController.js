const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Nunca se debe exponer el hash de la contraseña al frontend: ni para
// listar usuarios ni para precargar formularios de edición.
const stripPassword = (row) => {
    if (!row) return row;
    const { password, ...rest } = row;
    return rest;
};
const stripPasswords = (rows) => rows.map(stripPassword);

const getUsers = async (req, res) => {
    try{
        const [result] = await pool.execute("SELECT * FROM users WHERE 1 = 1")
        return res.status(200).json({
            message: "Usuarios",
            result: stripPasswords(result)
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
            result: stripPasswords(result)
        })
    }catch(error){
        return res.status(500).json({
            message:"Error, " + error.message
        })
    }
}

const setSettings = async (req, res) => {
    const { title, logo, gallery, ads , video, about, username, phone, email, address, x_link, instagram_link, youtube_link, facebook_link, tiktok_link} = req.body;

    try{
        await pool.execute("INSERT INTO settings (title,logo, gallery, ads, video_background, about, username, phone, email, address, x_link, instagram_link, youtube_link, facebook_link, tiktok_link) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [title,logo, gallery, ads, video, about, username, phone, email, address,x_link?x_link:'', instagram_link?instagram_link:'', youtube_link?youtube_link:'', facebook_link?facebook_link:'', tiktok_link?tiktok_link:'']);
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
                ads: adsCount[0][0]?.total_ads ? adsCount[0][0].total_ads : 0
            }
        });
    }catch(error){
        return res.status(500).json({
            message:"Error, " + error.message
        })
    }
}

const getCountsByTrainer = async (req, res) => {
    const {trainer_id} = req.params;
    try{
        const [clientsCount, exercisesCount, recipesCount, pendingPaymentsCount] = await Promise.all([
            pool.execute("SELECT COUNT(*) AS count FROM users INNER JOIN client_profiles ON client_profiles.user_id = users.id WHERE client_profiles.trainer_id = ? AND users.status = 1",[trainer_id]), //clientes
            pool.execute("SELECT COUNT(*) AS count FROM exercises WHERE trainer_id = ?",[trainer_id]), //ejercicios
            pool.execute("SELECT COUNT(*) AS count FROM recipes WHERE trainer_id = ? AND status = 1",[trainer_id]),
            pool.execute("SELECT COUNT(*) AS count FROM payments WHERE trainer_id = ? AND status = 'Pendiente'",[trainer_id])
        ]); 
        return res.status(200).json({
            message: "Conteos",
            counts: {
                clients: clientsCount[0][0].count,
                exercises: exercisesCount[0][0].count,
                recipes: recipesCount[0][0].count,
                pendingPayments: pendingPaymentsCount[0][0].count,
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
        const client_id = req.user.id;
        const role = req.user.role;
        if(role !== 'admin'){
            [rows] = await pool.execute("SELECT *, users.id as user_id, users.status as status_cuenta, client_profiles.status as client_profiles_status FROM users INNER JOIN client_profiles ON client_profiles.user_id = users.id WHERE client_profiles.trainer_id = ? ",[client_id]);
        }else{
            [rows] = await pool.execute("SELECT *, users.id as user_id, users.status as status_cuenta, client_profiles.status as client_profiles_status FROM users LEFT JOIN client_profiles ON client_profiles.user_id = users.id WHERE 1 = 1 ",[client_id]);
        }
        return res.status(200).json({
            message: "Listado de Clientes",
            clientes: stripPasswords(rows),
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
            entrenadores: stripPasswords(rows),
        });

    }catch(error){
        res.status(500).json({
            message: "Error",
            error: error.message
        })
    }
}

// Un trainer solo puede tocar usuarios que sean sus propios clientes.
// El admin no pasa por esta función (se le exime en cada endpoint).
const isOwnClient = async (trainerId, targetUserId) => {
    const [rows] = await pool.execute(
        "SELECT 1 FROM client_profiles WHERE user_id = ? AND trainer_id = ? LIMIT 1",
        [targetUserId, trainerId]
    );
    return rows.length > 0;
};

const deleteUser = async(req, res) => {
    try{
        const {id} = req.params;
        if(req.user.role !== 'admin'){
            const owns = await isOwnClient(req.user.id, id);
            if(!owns){
                return res.status(403).json({ message: "No tienes permiso para eliminar este usuario." });
            }
        }
        await pool.execute("UPDATE users SET deleted = 1 WHERE id = ?",[id]);
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
            return res.status(400).json({
                message: "Falta el Id del Usuario",
            });
        }
        if(req.user.role !== 'admin'){
            const owns = await isOwnClient(req.user.id, id);
            if(!owns){
                return res.status(403).json({ message: "No tienes permiso para modificar este usuario." });
            }
        }
        const {email, genre, name, password, phone, role, picture = '/images/avatar.png', status_cuenta} = req.body;

        const fields = { email, genre, name, phone, picture, status: status_cuenta };
        // Solo un admin puede cambiar el rol de un usuario.
        if (role != null && req.user.role === 'admin') fields.role = role;
        // Solo se toca la contraseña si el usuario escribió una nueva; si llega vacía, se conserva la actual.
        if (password && String(password).trim() !== '') {
            fields.password = await bcrypt.hash(String(password), 10);
        }

        const setClause = Object.keys(fields).map((key) => `${key} = ?`).join(', ');
        const values = [...Object.values(fields), id];

        await pool.execute(`UPDATE users SET ${setClause} WHERE id = ?`, values);

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
        if(req.user.role !== 'admin'){
            const owns = await isOwnClient(req.user.id, id);
            if(!owns){
                return res.status(403).json({ message: "No tienes permiso para restaurar este usuario." });
            }
        }
        await pool.execute("UPDATE users SET deleted = 0 WHERE id = ?",[id]);
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

const purgeDeletedUsers = async(req, res) => {
    try{
        const [result] = await pool.execute("DELETE FROM users WHERE deleted = 1");
        return res.status(200).json({
            message: "Usuarios eliminados permanentemente",
            deletedCount: result.affectedRows,
        });
    }catch(error){
        return res.status(500).json({
            message: "Error no se pudo eliminar permanentemente los usuarios",
            error: error.message
        });
    }
}

const updatePicture = async (req, res) => {
    try {
        const userId = req.user.id; // Or req.params.id depending on your workflow

        if (!req.file) {
            return res.status(400).json({ message: "No se ha proporcionado ninguna imagen" });
        }

        const picturePath = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        await pool.execute("UPDATE users SET picture = ? WHERE id = ?", [picturePath, userId]);

        return res.status(200).json({
            message: "Foto de perfil actualizada exitosamente",
            picture: picturePath
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error al guardar la imagen",
            error: error.message
        });
    }
};

const deletePicture = async (req, res) => {
    try {
        const userId = req.user.id; // Or req.params.id depending on your workflow

        await pool.execute("UPDATE users SET picture = NULL WHERE id = ?", [userId]);

        return res.status(200).json({
            message: "Foto de perfil eliminada exitosamente",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error al eliminar la imagen",
            error: error.message
        });
    }
};


// Add updatePicture to module.exports

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
    restoreUser,
    purgeDeletedUsers,
    getCountsByTrainer,
    updatePicture,
    deletePicture
}