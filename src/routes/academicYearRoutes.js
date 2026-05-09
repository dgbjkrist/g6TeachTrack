import { Router } from 'express';
import { getAllAcademicYears, getActiveAcademicYear, createAcademicYear, updateAcademicYear, deleteAcademicYear } from '../controllers/academicYearController.js';
import { verifyToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';

const router = Router();

// Toutes les routes nécessitent un admin
router.use(verifyToken, isAdmin);

router.get('/', getAllAcademicYears);
router.get('/active', getActiveAcademicYear);
router.post('/', createAcademicYear);
router.put('/:id', updateAcademicYear);
router.delete('/:id', deleteAcademicYear);

export default router;