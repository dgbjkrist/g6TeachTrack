import { Router } from 'express';
import { getTeacherHours } from '../controllers/hourController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin } from '../middleware/roleCheck.js';
import { validateUUIDParam } from '../middleware/validation.js';

const router = Router();

// Un enseignant peut consulter ses propres heures
router.get('/me', verifyToken, (req, res, next) => {
    if (!req.user.teacher_id) {
        return res.status(403).json({ success: false, error: 'Pas de profil enseignant associé' });
    }
    req.params.teacherId = req.user.teacher_id;
    next();
}, getTeacherHours);

router.get('/teacher/:teacherId', verifyToken, isSecretaireOrAdmin, validateUUIDParam('teacherId'), getTeacherHours);

export default router;
