import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    teacher_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'teachers', key: 'id' },
        onDelete: 'CASCADE'
    },
    academic_year_id: {
        type: DataTypes.UUID,
        references: { model: 'academic_years', key: 'id' },
        onDelete: 'SET NULL'
    },
    total_heures: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    heures_complementaires: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    montant_total: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
    type: DataTypes.STRING(20),
    defaultValue: 'en_attente',
    validate: {
        isIn: [['en_attente', 'paye', 'payé', 'annulé']]   // accepte les deux
    }
    },
    payment_date: {
        type: DataTypes.DATEONLY
    },
    notes: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'payments',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    underscored: true
});

export default Payment;