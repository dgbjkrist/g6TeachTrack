import { Router } from 'express';
import { getSequencesByCourse, createSequence, updateSequence, deleteSequence } from '../controllers/sequenceController.js';
import { verifyToken } from '../middleware/auth.js';
import { validateUUIDParam } from '../middleware/validation.js';

const router = Router();

// Accessible à tous les utilisateurs authentifiés (enseignants inclus)
router.get('/course/:courseId', verifyToken, validateUUIDParam('courseId'), getSequencesByCourse);
router.post('/', verifyToken, createSequence);
router.put('/:id', verifyToken, validateUUIDParam('id'), updateSequence);
router.delete('/:id', verifyToken, validateUUIDParam('id'), deleteSequence);

export default router;
