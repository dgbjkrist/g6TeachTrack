import db from '../models/index.js';

const Activity = db.Activity;
const Teacher = db.Teacher;
const AppSetting = db.AppSetting;

export const getTeacherHours = async (req, res, next) => {
    try {
        const { teacherId } = req.params;
        const activities = await Activity.findAll({
            where: { enseignant_id: teacherId, statut: 'Validée' }
        });
        const total = activities.reduce((sum, a) => sum + parseFloat(a.heures_calculees), 0);
        const settings = await AppSetting.findAll();
        const quota = parseFloat(settings.find(s => s.key === 'normal_hours_quota')?.value || 240);
        const complementaires = Math.max(0, total - quota);
        res.json({
            success: true,
            data: {
                total,
                normales: Math.min(total, quota),
                complementaires,
                quota,
                activities
            }
        });
    } catch (error) { next(error); }
};