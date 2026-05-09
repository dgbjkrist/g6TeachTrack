import { body, param, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }
    next();
};

export const validateTeacher = [
    body('nom').notEmpty().withMessage('Nom requis'),
    body('prenom').notEmpty().withMessage('Prénom requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('grade').isIn(['Assistant', 'Maître-Assistant', 'Professeur']),
    body('statut').isIn(['Permanent', 'Vacataire']),
    body('departement').notEmpty(),
    body('taux_horaire').isInt({ min: 0 }),
    validateRequest
];

export const validateTeacherUpdate = [
    param('id').isUUID(),
    body('nom').optional().notEmpty(),
    body('prenom').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('grade').optional().isIn(['Assistant', 'Maître-Assistant', 'Professeur']),
    body('statut').optional().isIn(['Permanent', 'Vacataire']),
    body('departement').optional().notEmpty(),
    body('taux_horaire').optional().isInt({ min: 0 }),
    validateRequest
];

export const validateUUIDParam = (paramName) => [
    param(paramName).isUUID().withMessage(`${paramName} doit être un UUID valide`),
    validateRequest
];

export const validateCourse = [
    body('intitule').notEmpty().withMessage('Intitulé requis'),
    body('filiere').notEmpty().withMessage('Filière requise'),
    body('niveau').isIn(['L1','L2','L3','M1','M2']).withMessage('Niveau invalide'),
    body('semestre').isIn([1,2]).withMessage('Semestre doit être 1 ou 2'),
    body('nombre_heures').isInt({ min: 1 }).withMessage('Heures > 0'),
    body('credits').isInt({ min: 1 }).withMessage('Crédits > 0'),
    validateRequest
];