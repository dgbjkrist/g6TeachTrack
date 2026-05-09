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
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect'
            });
        }

        const valid = await user.comparePassword(password);
        console.log('Résultat comparaison :', valid);
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