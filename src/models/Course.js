import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Course = sequelize.define('Course', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    intitule: { type: DataTypes.STRING(255), allowNull: false },
    filiere: { type: DataTypes.STRING(100), allowNull: false },
    niveau: { type: DataTypes.STRING(10), allowNull: false, validate: { isIn: [['L1','L2','L3','M1','M2']] } },
    semestre: { type: DataTypes.INTEGER, allowNull: false, validate: { isIn: [[1,2]] } },
    nombre_heures: { type: DataTypes.INTEGER, allowNull: false },
    credits: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
});

export default Course;