import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';


const CourseTeacher = sequelize.define('CourseTeacher', {
    academic_year_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'academic_years', key: 'id' },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'course_teachers',
    timestamps: false,
    underscored: true
});

export default CourseTeacher;