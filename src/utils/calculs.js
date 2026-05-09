export function calculerHeures(type, complexite) {
    const base = type === 'Création' ? 5 : 2;
    const mult = {
        'Faible': 1,
        'Moyen': 1.5,
        'Élevé': 2
    };
    return Math.round(base * (mult[complexite] || 1));
}