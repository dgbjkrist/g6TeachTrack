export const isAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs' });
    }
    next();
};

export const isSecretaireOrAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
    if (!['admin', 'secretaire'].includes(req.user.role)) {
        return res.status(403).json({ success: false, error: 'Accès réservé au secrétariat' });
    }
    next();
};

export const isTeacher = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
    if (!req.user.teacher_id) {
        return res.status(403).json({ success: false, error: 'Action réservée aux enseignants' });
    }
    next();
};