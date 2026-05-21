import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Resource = sequelize.define('Resource', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    titre: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.TEXT },
    complexite: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [['Faible','Moyen','Élevé']] } },
    contenu_texte: { type: DataTypes.TEXT },
    video_url: { type: DataTypes.TEXT },
    document_url: { type: DataTypes.TEXT },
    evaluation_url: { type: DataTypes.TEXT },
    quiz: { type: DataTypes.JSONB },
    course_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'courses', key: 'id' }, onDelete: 'CASCADE' },
    sequence_id: { type: DataTypes.UUID, references: { model: 'sequences', key: 'id' }, onDelete: 'SET NULL' }
}, {
    tableName: 'resources',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    underscored: true
});

export default Resource;