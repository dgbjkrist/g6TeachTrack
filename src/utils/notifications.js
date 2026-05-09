import db from '../models/index.js';

const Notification = db.Notification;

/**
 * Crée une notification pour un utilisateur
 * @param {string} userId - UUID de l'utilisateur
 * @param {string} type - ex: 'activity_pending', 'activity_validated', 'quota_exceeded'
 * @param {string} title - Titre de la notification
 * @param {string} message - Message détaillé
 */
export const createNotification = async (userId, type, title, message) => {
    try {
        await Notification.create({
            user_id: userId,
            type,
            title,
            message,
            is_read: false
        });
    } catch (error) {
        console.error('Erreur création notification:', error);
    }
};