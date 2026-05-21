import db from '../models/index.js';
import { createNotification } from '../utils/notifications.js';


const Activity = db.Activity;
const Teacher = db.Teacher;
const Resource = db.Resource;

// Liste des activités (avec pagination, filtres)
export const getActivities = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, statut, enseignant_id, academic_year_id } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (statut) where.statut = statut;
        if (enseignant_id) where.enseignant_id = enseignant_id;
        if (academic_year_id) where.academic_year_id = academic_year_id;

        const { rows, count } = await Activity.findAndCountAll({
            where,
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'nom', 'prenom'] },
                { model: Resource, as: 'resource', attributes: ['id', 'titre', 'type'] }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset
        });
        res.json({
            success: true,
            data: rows,
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
        });
    } catch (error) { next(error); }
};

// Valider ou rejeter une activité (admin/secrétaire)
export const validateActivity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        const activity = await Activity.findByPk(id, {
            include: [
                { model: db.Resource, as: 'resource', attributes: ['titre'] },
                { model: db.Teacher, as: 'teacher', attributes: ['id', 'prenom', 'nom'] }
            ]
        });
        if (!activity) return res.status(404).json({ success: false, error: 'Activité non trouvée' });

        const oldStatut = activity.statut;
        activity.statut = statut;
        activity.valide_par = req.user.id;
        activity.date_validation = new Date();
        await activity.save();

        if (oldStatut !== statut && (statut === 'Validée' || statut === 'Rejetée')) {
            // Récupérer l'utilisateur de l'enseignant
            const user = await db.User.findOne({ where: { teacher_id: activity.enseignant_id } });
            if (user) {
                const titreRessource = activity.resource?.titre || 'une ressource';
                let title, message;
                if (statut === 'Validée') {
                    title = 'Activité validée';
                    message = `Votre activité "${titreRessource}" a été validée. ${activity.heures_calculees} heures ont été ajoutées.`;
                } else {
                    title = 'Activité rejetée';
                    message = `Votre activité "${titreRessource}" a été rejetée. Veuillez la modifier.`;
                }
                await createNotification(user.id, `activity_${statut.toLowerCase()}`, title, message);
            }

            // Vérification du dépassement de quota (seulement si l'activité est validée)
            if (statut === 'Validée') {
                const settings = await db.AppSetting.findAll();
                const quota = parseFloat(settings.find(s => s.key === 'normal_hours_quota')?.value || 240);
                const allActivities = await db.Activity.findAll({
                    where: { enseignant_id: activity.enseignant_id, statut: 'Validée' }
                });
                const totalHeures = allActivities.reduce((sum, a) => sum + parseFloat(a.heures_calculees), 0);
                if (totalHeures > quota) {
                    const complementaires = totalHeures - quota;
                    // Notification à l'enseignant (déjà récupéré user)
                    if (user) {
                        await createNotification(
                            user.id,
                            'quota_exceeded',
                            'Dépassement du quota d’heures',
                            `Vous avez dépassé le quota annuel de ${quota} heures. Heures complémentaires : ${complementaires} h.`
                        );
                    }
                    // Notifier les admins/secrétaires
                    const adminUsers = await db.User.findAll({
                        where: { role: ['admin', 'secretaire'], is_active: true }
                    });
                    for (const admin of adminUsers) {
                        await createNotification(
                            admin.id,
                            'quota_exceeded_admin',
                            'Dépassement de quota – enseignant',
                            `L'enseignant ${activity.teacher?.prenom || ''} ${activity.teacher?.nom || ''} a dépassé le quota (${totalHeures}/${quota} h).`
                        );
                    }
                }
            }
        }

        res.json({ success: true, message: `Activité ${statut.toLowerCase()}` });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// Création manuelle d'une activité (si besoin)
export const createManualActivity = async (req, res, next) => {
    try {
        const activity = await Activity.create(req.body);
        res.status(201).json({ success: true, data: activity });
    } catch (error) { next(error); }
};