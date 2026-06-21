const GRADE_KEYS = {
    Assistant: 'assistant',
    'Maître-Assistant': 'maitre',
    Professeur: 'professor',
};

const LEGACY_GRADE_KEYS = {
    Assistant: 'hourly_rate_assistant',
    'Maître-Assistant': 'hourly_rate_maitre',
    Professeur: 'hourly_rate_professor',
};

/** Clé app_settings pour un grade + statut (ex. hourly_rate_assistant_permanent). */
export function hourlyRateSettingKey(grade, statut) {
    const gradeKey = GRADE_KEYS[grade];
    const statutKey = statut === 'Permanent' ? 'permanent' : 'vacataire';
    if (!gradeKey) return null;
    return `hourly_rate_${gradeKey}_${statutKey}`;
}

/** Résout le taux horaire depuis un objet { key: value } (app_settings). */
export function resolveHourlyRate(grade, statut, settings = {}) {
    const key = hourlyRateSettingKey(grade, statut);
    if (key && settings[key] != null && settings[key] !== '') {
        return parseInt(settings[key], 10);
    }
    const legacyKey = LEGACY_GRADE_KEYS[grade];
    if (legacyKey && settings[legacyKey] != null) {
        return parseInt(settings[legacyKey], 10);
    }
    const defaults = {
        Assistant: { Permanent: 2000, Vacataire: 1500 },
        'Maître-Assistant': { Permanent: 2800, Vacataire: 2200 },
        Professeur: { Permanent: 3500, Vacataire: 2800 },
    };
    return defaults[grade]?.[statut] ?? 2000;
}

export async function loadSettingsMap(AppSetting) {
    const rows = await AppSetting.findAll();
    const map = {};
    rows.forEach((s) => { map[s.key] = s.value; });
    return map;
}

export async function applyHourlyRateToTeacher(teacher, settingsMap) {
    const taux = resolveHourlyRate(teacher.grade, teacher.statut, settingsMap);
    if (teacher.taux_horaire !== taux) {
        await teacher.update({ taux_horaire: taux });
    }
    return taux;
}

export async function syncAllTeacherHourlyRates(Teacher, AppSetting) {
    const settingsMap = await loadSettingsMap(AppSetting);
    const teachers = await Teacher.findAll();
    for (const teacher of teachers) {
        await applyHourlyRateToTeacher(teacher, settingsMap);
    }
    return teachers.length;
}
