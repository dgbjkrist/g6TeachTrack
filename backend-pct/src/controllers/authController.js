import jwt from 'jsonwebtoken';
import 'dotenv/config';
import db from '../models/index.js';
import bcrypt from 'bcryptjs';

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

// ============================================================
// Connexion
// ============================================================
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        console.log({email, password});

        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        console.log({user});

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect'
            });
        }

        const valid = await user.comparePassword(password);

        console.log({valid});

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

// ============================================================
// Création d'un compte secrétaire (admin seulement)
// ============================================================
export const createSecretaire = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const existing = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Cet email est déjà utilisé' });
        }
        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email: email.toLowerCase(),
            password_hash: hashedPassword,
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

// ============================================================
// Création d'un compte enseignant lié à un teacher existant
// ============================================================
export const createEnseignantAccount = async (req, res, next) => {
    try {
        const { teacher_id, password } = req.body;
        const Teacher = db.Teacher;

        const teacher = await Teacher.findByPk(teacher_id);
        if (!teacher) {
            return res.status(404).json({ success: false, error: 'Enseignant introuvable' });
        }
        const existing = await User.findOne({ where: { email: teacher.email } });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Un compte existe déjà pour cet enseignant' });
        }
        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email: teacher.email,
            password_hash: hashedPassword,
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

// ============================================================
// Récupérer l'utilisateur courant
// ============================================================
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

// ============================================================
// Modifier son propre mot de passe (utilisateur connecté)
// ============================================================
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });

        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) return res.status(401).json({ success: false, error: 'Mot de passe actuel incorrect' });

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
        }

        user.password_hash = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: 'Mot de passe modifié avec succès' });
    } catch (error) {
        next(error);
    }
};