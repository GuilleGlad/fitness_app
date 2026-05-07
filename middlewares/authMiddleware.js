const jwt = require('jsonwebtoken');

const authenticateMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({
            mesasge: "Acceso denegado. Token de autenticacion requerido"
        });
    }
    const token = authHeader.split(' ')[1];
    try{
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err){
                console.error("Error en la autenticacion:", error.message);
                return res.status(401).json({
                    message: "Token invalido o expirado. Por favor, iniciar sesion de nuevo"
                })
            }
        req.user = decoded;
        next();
        })
    }catch(error){
        console.error("Error en la autenticacion", error.mesasge);
        return res.status(500).json({
            message: "Token invalido o expirado. Por favor,  iniciar sesión de nuevo."
        });
    }
}

module.exports = authenticateMiddleware;