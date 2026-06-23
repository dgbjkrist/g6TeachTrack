/**
 * Calcul unifié des montants de paiement (voir docs/CALCUL-HEURES-PAIEMENTS.md).
 * montant_dû = heures_complémentaires × taux_horaire
 */
export async function loadQuota(AppSetting) {
    const settings = await AppSetting.findAll();
    return parseFloat(settings.find(s => s.key === 'normal_hours_quota')?.value || 240);
}

export async function computeTeacherPaymentAmounts(db, { teacherId, academicYearId, tauxHoraire }) {
    const where = { enseignant_id: teacherId, statut: 'Validée' };
    if (academicYearId) where.academic_year_id = academicYearId;

    const activities = await db.Activity.findAll({ where });
    const totalHeures = activities.reduce((sum, a) => sum + parseFloat(a.heures_calculees), 0);
    const quota = await loadQuota(db.AppSetting);
    const heuresComplementaires = Math.max(0, totalHeures - quota);
    const taux = parseFloat(tauxHoraire);
    const montantTotal = Math.round(heuresComplementaires * taux);

    return {
        totalHeures,
        heuresNormales: Math.min(totalHeures, quota),
        heuresComplementaires,
        quota,
        montantTotal,
    };
}
