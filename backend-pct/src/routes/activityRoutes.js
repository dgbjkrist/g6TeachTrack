import { Router } from 'express';
import { getActivities, validateActivity, createManualActivity } from '../controllers/activityController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin } from '../middleware/roleCheck.js';
import { validateUUIDParam } from '../middleware/validation.js';

const router = Router();

// Un enseignant ne voit que ses propres activités (filtré par enseignant_id = teacher_id)
router.get('/', verifyToken, (req, res, next) => {
    if (req.user.role === 'enseignant') {
        if (!req.user.teacher_id) {
            return res.status(403).json({ success: false, error: 'Pas de profil enseignant associé' });
        }
        req.query.enseignant_id = req.user.teacher_id;
    }
    next();
}, getActivities);

router.put('/:id/validate', verifyToken, isSecretaireOrAdmin, validateUUIDParam('id'), validateActivity);
router.post('/', verifyToken, isSecretaireOrAdmin, createManualActivity);

export default router;
