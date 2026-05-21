import { Router } from 'express';
import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    assignTeacher,
    removeTeacher,
    carryOverAttributions
} from '../controllers/courseController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin, isAdmin } from '../middleware/roleCheck.js';
import { validateCourse, validateUUIDParam } from '../middleware/validation.js';

const router = Router();

// Lecture accessible a tous les utilisateurs authentifies
router.get('/', verifyToken, getAllCourses);
router.get('/:id', verifyToken, validateUUIDParam('id'), getCourseById);
router.post('/', verifyToken, isSecretaireOrAdmin, validateCourse, createCourse);
router.put('/:id', verifyToken, isSecretaireOrAdmin, validateUUIDParam('id'), validateCourse, updateCourse);
router.delete('/:id', verifyToken, isAdmin, validateUUIDParam('id'), deleteCourse);

// Reconduire attributions N-1 vers annee active (doit etre avant /:courseId/teachers/:teacherId)
router.post('/carry-over', verifyToken, isSecretaireOrAdmin, carryOverAttributions);

// Attribution / retrait d'enseignants (secretariat ou admin)
router.post('/:courseId/teachers/:teacherId', verifyToken, isSecretaireOrAdmin, assignTeacher);
router.delete('/:courseId/teachers/:teacherId', verifyToken, isSecretaireOrAdmin, removeTeacher);

export default router;
