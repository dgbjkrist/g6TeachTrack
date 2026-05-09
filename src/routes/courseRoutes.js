import { Router } from 'express';
import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    assignTeacher,
    removeTeacher
} from '../controllers/courseController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin, isAdmin } from '../middleware/roleCheck.js';
import { validateCourse, validateUUIDParam } from '../middleware/validation.js';

const router = Router();

// Routes accessibles au secrétariat ou admin
router.get('/', verifyToken, isSecretaireOrAdmin, getAllCourses);
router.get('/:id', verifyToken, isSecretaireOrAdmin, validateUUIDParam('id'), getCourseById);
router.post('/', verifyToken, isSecretaireOrAdmin, validateCourse, createCourse);
router.put('/:id', verifyToken, isSecretaireOrAdmin, validateUUIDParam('id'), validateCourse, updateCourse);
router.delete('/:id', verifyToken, isAdmin, validateUUIDParam('id'), deleteCourse);

// Attribution / retrait d’enseignants (secrétariat ou admin)
router.post('/:courseId/teachers/:teacherId', verifyToken, isSecretaireOrAdmin, assignTeacher);
router.delete('/:courseId/teachers/:teacherId', verifyToken, isSecretaireOrAdmin, removeTeacher);

export default router;