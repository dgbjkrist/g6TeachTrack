import jwt from 'jsonwebtoken';
import 'dotenv/config';
import db from '../models/index.js';

const User = db.User;

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            teacher_id: user.teacher_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

export const login = async (req, res, next) => {
    try {
        const email = (req.body.email || '').trim().toLowerCase();
        const password = req.body.password || '';

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email et mot de passe requis'
            });
        }

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect'
            });
        }

        const valid = await user.comparePassword(password);
        if (!valid) {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                error: 'Compte désactivé'
            });
        }

        await user.update({ last_login: new Date() });

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                teacher_id: user.teacher_id,
                is_active: user.is_active
            }
        });
    } catch (error) {
        next(error);
    }
};

// Créer un secrétaire (admin seulement)
export const createSecretaire = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const existing = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Cet email est déjà utilisé' });
        }
        const user = await User.create({
            email: email.toLowerCase(),
            password_hash: password,
            role: 'secretaire',
            is_active: true
        });
        res.status(201).json({
            success: true,
            message: 'Compte secrétaire créé',
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) { next(error); }
};

// Créer un compte enseignant lié à un teacher existant (admin seulement)
export const createEnseignantAccount = async (req, res, next) => {
    try {
        const { teacher_id, password } = req.body;
        const Teacher = db.Teacher;

        const teacher = await Teacher.findByPk(teacher_id);
        if (!teacher) {
            return res.status(404).json({ success: false, error: 'Enseignant introuvable' });
        }
        const email = teacher.email.trim().toLowerCase();
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Un compte existe déjà pour cet enseignant' });
        }
        const user = await User.create({
            email,
            password_hash: password,
            role: 'enseignant',
            teacher_id: teacher.id,
            is_active: true
        });
        res.status(201).json({
            success: true,
            message: `Compte créé pour ${teacher.prenom} ${teacher.nom}`,
            user: { id: user.id, email: user.email, role: user.role, teacher_id: user.teacher_id }
        });
    } catch (error) { next(error); }
};

export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash'] }
        });
        if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'Mot de passe actuel et nouveau requis' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
        }
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
        }
        const valid = await user.comparePassword(currentPassword);
        if (!valid) {
            return res.status(401).json({ success: false, error: 'Mot de passe actuel incorrect' });
        }
        user.password_hash = newPassword;
        await user.save();
        res.json({ success: true, message: 'Mot de passe modifié avec succès' });
    } catch (error) {
        next(error);
    }
};