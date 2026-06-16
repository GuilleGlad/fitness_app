// --- middlewares/roleMiddleware.js ---

const authorizeMiddleware = (...requiredRoles) => {
    // Devuelve una función que recibirá los parámetros de la petición
    roles = {
        admin: 1,
        trainer: 2,
        client: 3
    }

    return (req, res, next) => {
        // Asume que el middleware de autenticación ya adjuntó el usuario
        if (!req.user) {
            return res.status(401).json({ message: "Usuario no identificado." });
        }
        let hasRole;
        if(typeof req.user.role === 'number'){
            hasRole = Object.values(roles).includes(req.user.role);
        }else{
            hasRole = requiredRoles.includes(req.user.role);
        }
        if (!hasRole) {
            return res.status(403).json({ 
                message: "Acceso denegado. Rol insuficiente." 
            });
        }else{
            next(); // Si el rol es correcto, permite el paso.
        }
    };
};

module.exports = authorizeMiddleware;