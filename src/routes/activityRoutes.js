import { Router } from 'express';
import { getActivities, validateActivity, createManualActivity } from '../controllers/activityController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin, isAdmin } from '../middleware/roleCheck.js';
import { validateUUIDParam } from '../middleware/validation.js';

const router = Router();

// Routes accessibles au secrétariat/admin
router.get('/', verifyToken, isSecretaireOrAdmin, getActivities);
router.put('/:id/validate', verifyToken, isSecretaireOrAdmin, validateUUIDParam('id'), validateActivity);
router.post('/', verifyToken, isSecretaireOrAdmin, createManualActivity);

export default router;