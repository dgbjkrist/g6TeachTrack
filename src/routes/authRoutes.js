import { Router } from 'express';
import { login, getCurrentUser, createSecretaire, createEnseignantAccount } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import { body } from 'express-validator';
import { validateRequest, validateUUIDParam } from '../middleware/validation.js';

const router = Router();

const validateCreateSecretaire = [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
    validateRequest
];

const validateCreateEnseignant = [
    body('teacher_id').isUUID().withMessage('teacher_id doit être un UUID'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
    validateRequest
];

router.post('/login', login);
router.get('/me', verifyToken, getCurrentUser);

// Admin seulement
router.post('/create-secretaire', verifyToken, isAdmin, validateCreateSecretaire, createSecretaire);
router.post('/create-enseignant-account', verifyToken, isAdmin, validateCreateEnseignant, createEnseignantAccount);

export default router;
