import { Router } from 'express';
import { exportTeacherSheet, exportGlobalHours, exportPayment } from '../controllers/reportController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin } from '../middleware/roleCheck.js';
import { validateUUIDParam } from '../middleware/validation.js';

const router = Router();

router.get('/teacher/:teacherId', verifyToken, isSecretaireOrAdmin, validateUUIDParam('teacherId'), exportTeacherSheet);
router.get('/global-hours', verifyToken, isSecretaireOrAdmin, exportGlobalHours);
router.get('/payment', verifyToken, isSecretaireOrAdmin, exportPayment);

export default router;