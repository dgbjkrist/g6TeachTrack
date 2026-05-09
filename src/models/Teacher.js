import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Teacher = sequelize.define('Teacher', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    prenom: { type: DataTypes.STRING(100), allowNull: false },
    grade: { type: DataTypes.STRING(30), allowNull: false, validate: { isIn: [['Assistant', 'Maître-Assistant', 'Professeur']] } },
    statut: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [['Permanent', 'Vacataire']] } },
    departement: { type: DataTypes.STRING(100), allowNull: false },
    taux_horaire: { type: DataTypes.INTEGER, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    telephone: { type: DataTypes.STRING(50) }
}, {
    tableName: 'teachers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
});

export default Teacher;