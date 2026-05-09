import db from '../models/index.js';
import { calculerHeures } from '../utils/calculs.js';
import { createNotification } from '../utils/notifications.js';


const Resource = db.Resource;
const Activity = db.Activity;
const Teacher = db.Teacher;

export const getResourcesByCourse = async (req, res, next) => {
    try {
        const resources = await Resource.findAll({
            where: { course_id: req.params.courseId },
            include: [{ model: db.Sequence, as: 'sequence' }]
        });
        res.json({ success: true, data: resources });
    } catch (error) { next(error); }
};


export const createResource = async (req, res, next) => {
    try {
        const resource = await Resource.create(req.body);
        // Auto-création d'une activité "Création"
        if (req.user && req.user.teacher_id) {
            const heures = calculerHeures('Création', resource.complexite);
            const activity = await Activity.create({
                enseignant_id: req.user.teacher_id,
                resource_id: resource.id,
                type: 'Création',
                complexite: resource.complexite,
                date: new Date().toISOString().slice(0,10),
                heures_calculees: heures,
                statut: 'En attente'
            });

            // Notifier les admins et secrétaires
            const teacher = await Teacher.findByPk(req.user.teacher_id);
            if (teacher) {
                const adminUsers = await db.User.findAll({
                    where: { role: ['admin', 'secretaire'], is_active: true }
                });
                for (const admin of adminUsers) {
                    await createNotification(
                        admin.id,
                        'activity_pending',
                        'Nouvelle activité en attente',
                        `L'enseignant ${teacher.prenom} ${teacher.nom} a créé une ressource "${resource.titre}".`
                    );
                }
            }
        }
        res.status(201).json({ success: true, data: resource });
    } catch (error) { next(error); }
};


export const updateResource = async (req, res, next) => {
    try {
        const resource = await Resource.findByPk(req.params.id);
        if (!resource) return res.status(404).json({ success: false, error: 'Ressource non trouvée' });
        await resource.update(req.body);
        // Auto-activité "Mise à jour"
        if (req.user && req.user.teacher_id) {
            const heures = calculerHeures('Mise à jour', resource.complexite);
            await Activity.create({
                enseignant_id: req.user.teacher_id,
                resource_id: resource.id,
                type: 'Mise à jour',
                complexite: resource.complexite,
                date: new Date().toISOString().slice(0,10),
                heures_calculees: heures,
                statut: 'En attente'
            });
        }
        res.json({ success: true, data: resource });
    } catch (error) { next(error); }
};


export const deleteResource = async (req, res, next) => {
    try {
        const resource = await Resource.findByPk(req.params.id);
        if (!resource) return res.status(404).json({ success: false, error: 'Ressource non trouvée' });
        await resource.destroy();
        res.json({ success: true, message: 'Ressource supprimée' });
    } catch (error) { next(error); }
};