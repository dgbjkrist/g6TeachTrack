import db from '../models/index.js';

const Notification = db.Notification;

// Récupérer les notifications de l'utilisateur connecté
export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, data: notifications });
    } catch (error) { next(error); }
};

// Marquer une notification comme lue
export const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOne({
            where: { id, user_id: req.user.id }
        });
        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification non trouvée' });
        }
        notification.is_read = true;
        await notification.save();
        res.json({ success: true, message: 'Notification marquée comme lue' });
    } catch (error) { next(error); }
};