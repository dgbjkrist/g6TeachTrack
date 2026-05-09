import db from '../models/index.js';
import { createNotification } from '../utils/notifications.js';

const Payment = db.Payment;
const Teacher = db.Teacher;
const AcademicYear = db.AcademicYear;

// Récupérer tous les paiements (avec filtres optionnels)
export const getAllPayments = async (req, res, next) => {
    try {
        const { teacher_id, academic_year_id, status } = req.query;
        const where = {};
        if (teacher_id) where.teacher_id = teacher_id;
        if (academic_year_id) where.academic_year_id = academic_year_id;
        if (status) where.status = status;
        const payments = await Payment.findAll({
            where,
            include: [
                { model: Teacher, as: 'teacher', attributes: ['id', 'nom', 'prenom'] },
                { model: AcademicYear, as: 'academicYear', attributes: ['id', 'year_label'] }
            ],
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, data: payments });
    } catch (error) { next(error); }
};

// Créer un paiement à partir des heures d’un enseignant pour une année donnée
export const generatePayment = async (req, res, next) => {
    try {
        const { teacher_id, academic_year_id } = req.body;
        const teacher = await Teacher.findByPk(teacher_id);
        if (!teacher) return res.status(404).json({ success: false, error: 'Enseignant non trouvé' });

        const academicYear = academic_year_id ? await AcademicYear.findByPk(academic_year_id) : null;
        if (academic_year_id && !academicYear) return res.status(404).json({ success: false, error: 'Année académique non trouvée' });

        // Calculer les heures validées
        const activities = await db.Activity.findAll({
            where: { enseignant_id: teacher_id, statut: 'Validée' }
        });
        const totalHeures = activities.reduce((sum, a) => sum + parseFloat(a.heures_calculees), 0);
        const settings = await db.AppSetting.findAll();
        const quota = parseFloat(settings.find(s => s.key === 'normal_hours_quota')?.value || 240);
        const heuresComplementaires = Math.max(0, totalHeures - quota);
        const montantTotal = totalHeures * teacher.taux_horaire;

        const payment = await Payment.create({
            teacher_id,
            academic_year_id: academic_year_id || null,
            total_heures: totalHeures,
            heures_complementaires: heuresComplementaires,
            montant_total: montantTotal,
            status: 'en_attente'
        });

        res.status(201).json({ success: true, data: payment });
    } catch (error) { next(error); }
};

// Mettre à jour le statut d’un paiement (ex: marquer comme payé) avec notification
export const updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, payment_date, notes } = req.body;
        
        const payment = await Payment.findByPk(id, {
            include: [{ model: Teacher, as: 'teacher' }]
        });
        if (!payment) return res.status(404).json({ success: false, error: 'Paiement non trouvé' });
        
        const oldStatus = payment.status;
        await payment.update({ status, payment_date, notes });
        
        // Si le statut passe à 'payé', envoyer une notification à l'enseignant
        if (status === 'payé' && oldStatus !== 'payé') {
            const user = await db.User.findOne({ where: { teacher_id: payment.teacher_id } });
            if (user) {
                await createNotification(
                    user.id,
                    'payment_confirmed',
                    'Paiement confirmé',
                    `Votre paiement de ${payment.montant_total} FCFA a été confirmé.`
                );
            }
        }
        
        res.json({ success: true, message: 'Statut du paiement mis à jour', data: payment });
    } catch (error) { next(error); }
};

// Supprimer un paiement (admin)
export const deletePayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findByPk(id);
        if (!payment) return res.status(404).json({ success: false, error: 'Paiement non trouvé' });
        await payment.destroy();
        res.json({ success: true, message: 'Paiement supprimé' });
    } catch (error) { next(error); }
};