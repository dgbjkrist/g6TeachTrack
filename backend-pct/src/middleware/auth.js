import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, error: 'Token invalide' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, error: 'Token expiré' });
        }
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};