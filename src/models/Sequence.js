import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Sequence = sequelize.define('Sequence', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    titre: { type: DataTypes.STRING(255), allowNull: false },
    ordre: { type: DataTypes.INTEGER, allowNull: false },
    course_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'courses', key: 'id' }, onDelete: 'CASCADE' }
}, {
    tableName: 'sequences',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    underscored: true
});

export default Sequence;