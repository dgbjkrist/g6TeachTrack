import db from '../models/index.js';

const AcademicYear = db.AcademicYear;

// Récupérer toutes les années académiques
export const getAllAcademicYears = async (req, res, next) => {
    try {
        const years = await AcademicYear.findAll({ order: [['year_label', 'DESC']] });
        res.json({ success: true, data: years });
    } catch (error) { next(error); }
};

// Récupérer l’année active
export const getActiveAcademicYear = async (req, res, next) => {
    try {
        const active = await AcademicYear.findOne({ where: { is_active: true } });
        res.json({ success: true, data: active });
    } catch (error) { next(error); }
};

// Créer une nouvelle année académique
export const createAcademicYear = async (req, res, next) => {
    try {
        const { year_label, start_date, end_date, is_active } = req.body;
        if (is_active) {
            // Désactiver toutes les autres années avant d’activer celle-ci
            await AcademicYear.update({ is_active: false }, { where: {} });
        }
        const year = await AcademicYear.create({ year_label, start_date, end_date, is_active });
        res.status(201).json({ success: true, data: year });
    } catch (error) { next(error); }
};

// Mettre à jour une année (notamment activer/désactiver)
export const updateAcademicYear = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { year_label, start_date, end_date, is_active } = req.body;
        const year = await AcademicYear.findByPk(id);
        if (!year) return res.status(404).json({ success: false, error: 'Année non trouvée' });
        if (is_active) {
            await AcademicYear.update({ is_active: false }, { where: {} });
        }
        await year.update({ year_label, start_date, end_date, is_active });
        res.json({ success: true, data: year });
    } catch (error) { next(error); }
};

// Supprimer une année
export const deleteAcademicYear = async (req, res, next) => {
    try {
        const { id } = req.params;
        const year = await AcademicYear.findByPk(id);
        if (!year) return res.status(404).json({ success: false, error: 'Année non trouvée' });
        await year.destroy();
        res.json({ success: true, message: 'Année supprimée' });
    } catch (error) { next(error); }
};