import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AppSetting = sequelize.define('AppSetting', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'app_settings',
    timestamps: false,
    underscored: true,
    updatedAt: 'updated_at'
});

export default AppSetting;