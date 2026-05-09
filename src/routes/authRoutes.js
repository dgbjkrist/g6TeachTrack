import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js'; // sera créé à l'étape 10

const router = Router();

router.post('/login', login);
// Route protégée (à activer après création du middleware)
// router.get('/me', verifyToken, getCurrentUser);
router.get('/me', verifyToken, getCurrentUser);

export default router;