import db from '../models/index.js';
import {
    loadSettingsMap,
    resolveHourlyRate,
} from '../utils/hourlyRates.js';

const Teacher = db.Teacher;
const User = db.User;
const AppSetting = db.AppSetting;
const { Op } = db.Sequelize;

// Liste des enseignants (pagination, filtres)
export const getAllTeachers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, departement, grade, statut, search } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (departement) where.departement = departement;
        if (grade) where.grade = grade;
        if (statut) where.statut = statut;
        if (search) {
            where[Op.or] = [
                { nom: { [Op.iLike]: `%${search}%` } },
                { prenom: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }
        const { count, rows } = await Teacher.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['nom', 'ASC']]
        });
        res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) { next(error); }
};

// Détail d'un enseignant (+ compte utilisateur lié le cas échéant)
export const getTeacherById = async (req, res, next) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id);
        if (!teacher) return res.status(404).json({ success: false, error: 'Enseignant non trouvé' });
        const linkedUser = await User.findOne({
            where: { teacher_id: teacher.id },
            attributes: ['id', 'email', 'role', 'is_active', 'created_at'],
        });
        res.json({
            success: true,
            data: {
                ...teacher.toJSON(),
                linkedUser: linkedUser ?? null,
            },
        });
    } catch (error) { next(error); }
};

// Créer un enseignant (taux horaire dérivé des paramètres grade + statut)
export const createTeacher = async (req, res, next) => {
    try {
        const existing = await Teacher.findOne({ where: { email: req.body.email } });
        if (existing) return res.status(409).json({ success: false, error: 'Cet email existe déjà' });
        const settingsMap = await loadSettingsMap(AppSetting);
        const { taux_horaire: _ignored, ...payload } = req.body;
        const teacher = await Teacher.create({
            ...payload,
            taux_horaire: resolveHourlyRate(payload.grade, payload.statut, settingsMap),
        });
        res.status(201).json({ success: true, data: teacher });
    } catch (error) { next(error); }
};

// Mettre à jour un enseignant (recalcule le taux si grade ou statut change)
export const updateTeacher = async (req, res, next) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id);
        if (!teacher) return res.status(404).json({ success: false, error: 'Enseignant non trouvé' });
        const settingsMap = await loadSettingsMap(AppSetting);
        const { taux_horaire: _ignored, ...payload } = req.body;
        const grade = payload.grade ?? teacher.grade;
        const statut = payload.statut ?? teacher.statut;
        if (payload.email) {
            payload.email = payload.email.trim().toLowerCase();
        }
        await teacher.update({
            ...payload,
            taux_horaire: resolveHourlyRate(grade, statut, settingsMap),
        });
        // Garder l'email de connexion aligné avec la fiche enseignant
        if (payload.email) {
            const linkedUser = await User.findOne({ where: { teacher_id: teacher.id } });
            if (linkedUser && linkedUser.email !== payload.email) {
                const emailTaken = await User.findOne({
                    where: { email: payload.email, id: { [Op.ne]: linkedUser.id } },
                });
                if (emailTaken) {
                    return res.status(409).json({
                        success: false,
                        error: 'Cet email est déjà utilisé par un autre compte',
                    });
                }
                await linkedUser.update({ email: payload.email });
            }
        }
        await teacher.reload();
        res.json({ success: true, data: teacher });
    } catch (error) { next(error); }
};

// Supprimer un enseignant
export const deleteTeacher = async (req, res, next) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id);
        if (!teacher) return res.status(404).json({ success: false, error: 'Enseignant non trouvé' });
        await teacher.destroy();
        res.json({ success: true, message: 'Enseignant supprimé' });
    } catch (error) { 
        console.error('❌ Détails de l’erreur :', error.original ? error.original.message : error.message);
        next(error); 
    }
};

// Statistiques des enseignants
export const getTeacherStats = async (req, res, next) => {
    try {
        const total = await Teacher.count();
        const byGrade = await Teacher.findAll({
            attributes: ['grade', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']],
            group: ['grade']
        });
        const byStatus = await Teacher.findAll({
            attributes: ['statut', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']],
            group: ['statut']
        });
        const byDepartement = await Teacher.findAll({
            attributes: ['departement', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count']],
            group: ['departement']
        });
        res.json({ success: true, data: { total, byGrade, byStatus, byDepartement } });
    } catch (error) { next(error); }
};