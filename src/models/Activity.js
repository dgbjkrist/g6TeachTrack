import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Activity = sequelize.define('Activity', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    enseignant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'teachers', key: 'id' },
        onDelete: 'CASCADE'
    },
    resource_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'resources', key: 'id' },
        onDelete: 'CASCADE'
    },
    type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: { isIn: [['Création', 'Mise à jour']] }
    },
    complexite: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: { isIn: [['Faible', 'Moyen', 'Élevé']] }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    heures_calculees: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    statut: {
        type: DataTypes.STRING(20),
        defaultValue: 'En attente',
        validate: { isIn: [['En attente', 'Validée', 'Rejetée']] }
    },
    valide_par: {
        type: DataTypes.UUID,
        references: { model: 'users', key: 'id' }
    },
    date_validation: {
        type: DataTypes.DATE
    },
    academic_year_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'academic_years', key: 'id' },
        onDelete: 'SET NULL'
    }
}, {
    tableName: 'activities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
});

export default Activity;