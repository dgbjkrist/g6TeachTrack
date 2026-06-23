import db from '../models/index.js';
import { createNotification } from '../utils/notifications.js';
import { computeTeacherPaymentAmounts } from '../utils/paymentCalculations.js';

const Payment = db.Payment;
const Teacher = db.Teacher;
const AcademicYear = db.AcademicYear;
const { Op } = db.Sequelize;

const paymentIncludes = [
    { model: Teacher, as: 'teacher', attributes: ['id', 'nom', 'prenom'] },
    { model: AcademicYear, as: 'academicYear', attributes: ['id', 'year_label'] },
];

async function resolveAcademicYear(academicYearId) {
    if (academicYearId === null || academicYearId === undefined) return null;
    return AcademicYear.findByPk(academicYearId);
}

async function applyCalculatedAmounts(payment, teacher, academicYearId) {
    const amounts = await computeTeacherPaymentAmounts(db, {
        teacherId: teacher.id,
        academicYearId: academicYearId ?? null,
        tauxHoraire: teacher.taux_horaire,
    });
    await payment.update({
        total_heures: amounts.totalHeures,
        heures_complementaires: amounts.heuresComplementaires,
        montant_total: amounts.montantTotal,
    });
    return payment;
}

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
            include: paymentIncludes,
            order: [['created_at', 'DESC']],
        });
        res.json({ success: true, data: payments });
    } catch (error) { next(error); }
};

// Aperçu du montant avant génération (heures validées × taux, année filtrée)
export const previewPayment = async (req, res, next) => {
    try {
        const { teacher_id, academic_year_id } = req.query;
        const teacher = await Teacher.findByPk(teacher_id);
        if (!teacher) return res.status(404).json({ success: false, error: 'Enseignant non trouvé' });

        let yearId = academic_year_id || null;
        if (yearId) {
            const year = await AcademicYear.findByPk(yearId);
            if (!year) return res.status(404).json({ success: false, error: 'Année académique non trouvée' });
        } else {
            const activeYear = await AcademicYear.findOne({ where: { is_active: true } });
            yearId = activeYear?.id ?? null;
        }

        const amounts = await computeTeacherPaymentAmounts(db, {
            teacherId: teacher.id,
            academicYearId: yearId,
            tauxHoraire: teacher.taux_horaire,
        });

        res.json({
            success: true,
            data: {
                ...amounts,
                taux_horaire: parseFloat(teacher.taux_horaire),
                academic_year_id: yearId,
            },
        });
    } catch (error) { next(error); }
};

// Créer ou mettre à jour un paiement en attente pour un enseignant / année
export const generatePayment = async (req, res, next) => {
    try {
        const { teacher_id, academic_year_id } = req.body;
        const teacher = await Teacher.findByPk(teacher_id);
        if (!teacher) return res.status(404).json({ success: false, error: 'Enseignant non trouvé' });

        const academicYear = await resolveAcademicYear(academic_year_id);
        if (academic_year_id && !academicYear) {
            return res.status(404).json({ success: false, error: 'Année académique non trouvée' });
        }
        const yearId = academicYear?.id ?? null;

        const existingWhere = { teacher_id, status: 'en_attente' };
        if (yearId) {
            existingWhere.academic_year_id = yearId;
        } else {
            existingWhere.academic_year_id = { [Op.is]: null };
        }

        const existing = await Payment.findOne({ where: existingWhere });
        if (existing) {
            await applyCalculatedAmounts(existing, teacher, yearId);
            await existing.reload({ include: paymentIncludes });
            return res.json({
                success: true,
                message: 'Paiement recalculé (déjà en attente pour cette année)',
                data: existing,
            });
        }

        const amounts = await computeTeacherPaymentAmounts(db, {
            teacherId: teacher.id,
            academicYearId: yearId,
            tauxHoraire: teacher.taux_horaire,
        });

        const payment = await Payment.create({
            teacher_id,
            academic_year_id: yearId,
            total_heures: amounts.totalHeures,
            heures_complementaires: amounts.heuresComplementaires,
            montant_total: amounts.montantTotal,
            status: 'en_attente',
        });
        await payment.reload({ include: paymentIncludes });

        res.status(201).json({ success: true, data: payment });
    } catch (error) { next(error); }
};

// Recalculer un paiement en attente à partir des heures actuelles
export const recalculatePayment = async (req, res, next) => {
    try {
        const payment = await Payment.findByPk(req.params.id, {
            include: [{ model: Teacher, as: 'teacher' }],
        });
        if (!payment) return res.status(404).json({ success: false, error: 'Paiement non trouvé' });
        if (payment.status !== 'en_attente') {
            return res.status(400).json({
                success: false,
                error: 'Seuls les paiements en attente peuvent être recalculés',
            });
        }

        await applyCalculatedAmounts(payment, payment.teacher, payment.academic_year_id);
        await payment.reload({ include: paymentIncludes });

        res.json({ success: true, message: 'Montant recalculé', data: payment });
    } catch (error) { next(error); }
};

// Mettre à jour le statut d’un paiement (ex: marquer comme payé) avec notification
export const updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, payment_date, notes } = req.body;

        const payment = await Payment.findByPk(id, {
            include: [{ model: Teacher, as: 'teacher' }],
        });
        if (!payment) return res.status(404).json({ success: false, error: 'Paiement non trouvé' });

        const oldStatus = payment.status;
        await payment.update({ status, payment_date, notes });

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
