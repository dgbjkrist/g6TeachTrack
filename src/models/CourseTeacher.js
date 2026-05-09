import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CourseTeacher = sequelize.define('CourseTeacher', {}, {
    tableName: 'course_teachers',
    timestamps: false,
    underscored: true
});

export default CourseTeacher;