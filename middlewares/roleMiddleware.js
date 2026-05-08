// --- middlewares/roleMiddleware.js ---

const authorizeMiddleware = (requiredRole) => {
    // Devuelve una función que recibirá los parámetros de la petición
    return (req, res, next) => {
        // Asume que el middleware de autenticación ya adjuntó el usuario
        if (!req.user) {
            return res.status(401).json({ message: "Usuario no identificado." });
        }
        
        if (req.user.role !== requiredRole) {
            return res.status(403).json({ 
                message: "Acceso denegado. Rol insuficiente." 
            });
        }else{
            next(); // Si el rol es correcto, permite el paso.
        }
        
    };
};

module.exports = authorizeMiddleware;