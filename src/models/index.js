import sequelize from '../config/database.js';
import User from './User.js';
import Teacher from './Teacher.js';
import Course from './Course.js';
import CourseTeacher from './CourseTeacher.js';
import Sequence from './Sequence.js';
import Resource from './Resource.js';
import Activity from './Activity.js';
import AppSetting from './AppSetting.js';
import Notification from './Notification.js';
import Payment from './Payment.js';
import AcademicYear from './AcademicYear.js';

const db = {};

db.sequelize = sequelize;
db.Sequelize = sequelize.constructor;

db.User = User;
db.Teacher = Teacher;
db.Course = Course;
db.CourseTeacher = CourseTeacher;
db.Sequence = Sequence;
db.Resource = Resource;
db.Activity = Activity;
db.AppSetting = AppSetting;
db.Notification = Notification;
db.Payment = Payment;
db.AcademicYear = AcademicYear;

// Associations User ↔ Teacher
User.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
Teacher.hasOne(User, { foreignKey: 'teacher_id', as: 'user' });

// Many-to-many Course ↔ Teacher
Course.belongsToMany(Teacher, { through: CourseTeacher, foreignKey: 'course_id', otherKey: 'teacher_id', as: 'teachers' });
Teacher.belongsToMany(Course, { through: CourseTeacher, foreignKey: 'teacher_id', otherKey: 'course_id', as: 'courses' });

// Course ↔ Sequence
Course.hasMany(Sequence, { foreignKey: 'course_id', as: 'sequences' });
Sequence.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Course ↔ Resource
Resource.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasMany(Resource, { foreignKey: 'course_id', as: 'resources' });

// Sequence ↔ Resource
Resource.belongsTo(Sequence, { foreignKey: 'sequence_id', as: 'sequence' });
Sequence.hasMany(Resource, { foreignKey: 'sequence_id', as: 'resources' });

// Activity associations
Activity.belongsTo(Teacher, { foreignKey: 'enseignant_id', as: 'teacher' });
Activity.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });
Activity.belongsTo(User, { foreignKey: 'valide_par', as: 'validator' });
Teacher.hasMany(Activity, { foreignKey: 'enseignant_id', as: 'activities' });
Resource.hasMany(Activity, { foreignKey: 'resource_id', as: 'activities' });

// Notification
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Associations
Payment.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
Teacher.hasMany(Payment, { foreignKey: 'teacher_id', as: 'payments' });

Payment.belongsTo(AcademicYear, { foreignKey: 'academic_year_id', as: 'academicYear' });
AcademicYear.hasMany(Payment, { foreignKey: 'academic_year_id', as: 'payments' });


export default db;