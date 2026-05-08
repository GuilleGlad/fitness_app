const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]
        );

        const userId = result.insertId;

        const token = jwt.sign(
            { 
                id: userId,
                name: name,
                email: email,
                role: role,                 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: "Registro Exitoso",
            token,
            user: { id: userId, name, email, role }
        })

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Este email ya está registrado." });
        }
        res.status(500).json({ message: "Error interno del servidor al registrar." });
    }

}

const loginUser = async (req, res) => {
    const {email, password} = req.body;

    try { 
        const[rows] = await pool.execute(
            'SELECT id, name, email, password, role, created_at FROM users WHERE email = ?',
            [email]
        );
        if(rows.length === 0){
            return res.status(401).json({message: "Credenciales Inválidas"});
        }

        const user = rows[0];
        
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json(
                {message: "Credenciales Inválidas."}
            )
        }

        const token = jwt.sign(
            {
                id: user.id, 
                name: user.name,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.status(201).json(
            {
                message: "Login Exitoso",
                token,
                user: {id: user.id, role: user.role, name: user.name}
            }
        )
    }catch(error){
        console.error("Error al iniciar sesion.", error);
        res.status(500).json({
            message: "Error interno del servidor durante el login"
        });
    }
}

const testAuth = async (req, res) => {
    //ADMIN ROLE
    res.status(200).json(
        {
            message: "Test Successfully completed",
            token: {token: req.token},
            user: {id: req.user.id, role: req.user.role}
        }
    )
}

const logoutUser = async (req, res) => {

}

const meGet = async(req, res) => {
    return res.status(200).json({
        message: "Datos",
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        }
    });
}

const mePut = async(req, res) => {
    const {id, name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Todos los campos son requeridos." });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.execute(
            'UPDATE `users` SET `name` = ?, `email` = ?, `password` = ? WHERE `id` = ?', [name, email, hashedPassword,id]
        );
        
        const token = jwt.sign(
            { 
                id: id,
                name: name,
                email: email,
                role: role,                 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: "Actualizacion de Datos Completa",
            token,
            user: { id: id, name, email, role }
        })
        
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ message: "Error interno del servidor al actualizar." });
    }

}

module.exports = {
    registerUser,
    loginUser,
    testAuth,
    logoutUser,
    meGet,
    mePut,
}