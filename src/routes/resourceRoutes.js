import { Router } from 'express';
import { getResourcesByCourse, createResource, updateResource, deleteResource } from '../controllers/resourceController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin, isTeacher } from '../middleware/roleCheck.js';
import { validateUUIDParam } from '../middleware/validation.js';

const router = Router();

router.get('/course/:courseId', verifyToken, validateUUIDParam('courseId'), getResourcesByCourse);
// POST et PUT autorisés aux enseignants (via isTeacher) et aux secrétaires/admins
router.post('/', verifyToken, (req, res, next) => {
    if (req.user.role === 'enseignant') return isTeacher(req, res, next);
    return isSecretaireOrAdmin(req, res, next);
}, createResource);

router.put('/:id', verifyToken, (req, res, next) => {
    if (req.user.role === 'enseignant') return isTeacher(req, res, next);
    return isSecretaireOrAdmin(req, res, next);
}, updateResource);
router.delete('/:id', verifyToken, (req, res, next) => {
    if (req.user.role === 'enseignant') return isTeacher(req, res, next);
    return isSecretaireOrAdmin(req, res, next);
}, deleteResource);

export default router;