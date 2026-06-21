// src/controllers/adminController.js
import db from '../models/index.js';
import logger from '../utils/logger.js';

const User = db.User;
const Teacher = db.Teacher;

// Récupérer tous les utilisateurs (admin seulement)
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password_hash'] },
            include: [{ model: Teacher, as: 'teacher', attributes: ['id', 'nom', 'prenom'] }],
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, data: users });
    } catch (error) { next(error); }
};

// Mettre à jour le mot de passe d'un utilisateur (admin seulement)
export const updateUserPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        // Texte clair ici : le hook beforeUpdate du modèle User applique bcrypt une seule fois.
        user.password_hash = newPassword;
        await user.save();

        logger.info(`Mot de passe modifié par admin pour l'utilisateur ${user.email} (ID: ${user.id})`);

        res.json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });
    } catch (error) { next(error); }
};