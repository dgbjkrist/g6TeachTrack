import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AcademicYear = sequelize.define('AcademicYear', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    year_label: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            is: /^\d{4}-\d{4}$/ // format 2024-2025
        }
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'academic_years',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
});

export default AcademicYear;