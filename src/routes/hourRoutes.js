import { Router } from 'express';
import { getTeacherHours } from '../controllers/hourController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin } from '../middleware/roleCheck.js';
import { validateUUIDParam } from '../middleware/validation.js';

const router = Router();

router.get('/teacher/:teacherId', verifyToken, isSecretaireOrAdmin, validateUUIDParam('teacherId'), getTeacherHours);

export default router;