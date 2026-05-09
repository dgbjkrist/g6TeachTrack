import { Router } from 'express';
import { getSequencesByCourse, createSequence, updateSequence, deleteSequence } from '../controllers/sequenceController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin } from '../middleware/roleCheck.js';
import { validateUUIDParam } from '../middleware/validation.js';

const router = Router();

router.get('/course/:courseId', verifyToken, isSecretaireOrAdmin, validateUUIDParam('courseId'), getSequencesByCourse);
router.post('/', verifyToken, isSecretaireOrAdmin, createSequence);
router.put('/:id', verifyToken, isSecretaireOrAdmin, validateUUIDParam('id'), updateSequence);
router.delete('/:id', verifyToken, isSecretaireOrAdmin, validateUUIDParam('id'), deleteSequence);

export default router;