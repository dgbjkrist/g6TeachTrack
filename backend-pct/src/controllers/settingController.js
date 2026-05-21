import db from '../models/index.js';

const AppSetting = db.AppSetting;

// Récupérer tous les paramètres (retourne un objet {key: value})
export const getSettings = async (req, res, next) => {
    try {
        const settings = await AppSetting.findAll();
        const obj = {};
        settings.forEach(s => { obj[s.key] = s.value; });
        res.json({ success: true, data: obj });
    } catch (error) { next(error); }
};

// Mettre à jour un ou plusieurs paramètres
export const updateSettings = async (req, res, next) => {
    try {
        const updates = req.body;
        for (const [key, value] of Object.entries(updates)) {
            await AppSetting.update(
                { value: String(value) },
                { where: { key } }
            );
        }
        res.json({ success: true, message: 'Paramètres mis à jour' });
    } catch (error) { next(error); }
};