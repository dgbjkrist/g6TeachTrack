import db from '../models/index.js';

const Activity = db.Activity;
const AppSetting = db.AppSetting;
const AcademicYear = db.AcademicYear;

export const getTeacherHours = async (req, res, next) => {
    try {
        const { teacherId } = req.params;
        // academic_year_id : query param > année active > null (toutes années)
        let { academic_year_id } = req.query;

        if (!academic_year_id) {
            const activeYear = await AcademicYear.findOne({ where: { is_active: true } });
            academic_year_id = activeYear?.id ?? null;
        }

        const where = { enseignant_id: teacherId, statut: 'Validée' };
        if (academic_year_id) where.academic_year_id = academic_year_id;

        const activities = await Activity.findAll({
            where,
            include: [{ model: db.Resource, as: 'resource', attributes: ['id', 'titre', 'type'] }]
        });

        const total = activities.reduce((sum, a) => sum + parseFloat(a.heures_calculees), 0);
        const settings = await AppSetting.findAll();
        const quota = parseFloat(settings.find(s => s.key === 'normal_hours_quota')?.value || 240);
        const complementaires = Math.max(0, total - quota);

        // Récupérer l'année académique de référence pour l'inclure dans la réponse
        const academicYear = academic_year_id
            ? await AcademicYear.findByPk(academic_year_id, { attributes: ['id', 'year_label'] })
            : null;

        res.json({
            success: true,
            data: {
                total,
                normales: Math.min(total, quota),
                complementaires,
                quota,
                academic_year_id: academic_year_id ?? null,
                academicYear,
                activities
            }
        });
    } catch (error) { next(error); }
};
