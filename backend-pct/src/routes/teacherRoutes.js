import { Router } from 'express';
import {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacherStats
} from '../controllers/teacherController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin, isAdmin } from '../middleware/roleCheck.js';
import { validateTeacher, validateTeacherUpdate, validateUUIDParam } from '../middleware/validation.js';

const router = Router();

// Routes accessibles au secrétariat ou admin
router.get('/', verifyToken, isSecretaireOrAdmin, getAllTeachers);
router.get('/stats', verifyToken, isSecretaireOrAdmin, getTeacherStats);
router.get('/:id', verifyToken, isSecretaireOrAdmin, validateUUIDParam('id'), getTeacherById);
router.post('/', verifyToken, isSecretaireOrAdmin, validateTeacher, createTeacher);
router.put('/:id', verifyToken, isSecretaireOrAdmin, validateUUIDParam('id'), validateTeacherUpdate, updateTeacher);
router.delete('/:id', verifyToken, isAdmin, validateUUIDParam('id'), deleteTeacher);

export default router;