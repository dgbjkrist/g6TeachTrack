// src/routes/adminRoutes.js
import { Router } from 'express';
import { getAllUsers, updateUserPassword } from '../controllers/adminController.js';
import { verifyToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';

const router = Router();

// Toutes les routes nécessitent authentification et rôle admin
router.use(verifyToken, isAdmin);

router.get('/users', getAllUsers);
router.put('/users/:id/password', updateUserPassword);

export default router;