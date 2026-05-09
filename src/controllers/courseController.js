import db from '../models/index.js';

const Course = db.Course;
const Teacher = db.Teacher;

// Lister les cours (pagination, filtres)
export const getAllCourses = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, filiere, niveau } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (filiere) where.filiere = filiere;
        if (niveau) where.niveau = niveau;

        const { count, rows } = await Course.findAndCountAll({
            where,
            include: [{ model: Teacher, as: 'teachers', through: { attributes: [] } }],
            limit: parseInt(limit),
            offset,
            order: [['intitule', 'ASC']]
        });
        res.json({
            success: true,
            data: rows,
            pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) }
        });
    } catch (error) { next(error); }
};

// Détail d'un cours
export const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [{ model: Teacher, as: 'teachers' }]
        });
        if (!course) return res.status(404).json({ success: false, error: 'Cours non trouvé' });
        res.json({ success: true, data: course });
    } catch (error) { next(error); }
};

// Créer un cours
export const createCourse = async (req, res, next) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json({ success: true, data: course });
    } catch (error) { next(error); }
};

// Mettre à jour un cours
export const updateCourse = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ success: false, error: 'Cours non trouvé' });
        await course.update(req.body);
        res.json({ success: true, data: course });
    } catch (error) { next(error); }
};

// Supprimer un cours
export const deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ success: false, error: 'Cours non trouvé' });
        await course.destroy();
        res.json({ success: true, message: 'Cours supprimé' });
    } catch (error) { next(error); }
};

// Attribuer à un enseignant un cours
export const assignTeacher = async (req, res, next) => {
    try {
        const { courseId, teacherId } = req.params;
        const course = await Course.findByPk(courseId);
        const teacher = await Teacher.findByPk(teacherId);
        if (!course || !teacher) return res.status(404).json({ success: false, error: 'Cours ou enseignant non trouvé' });
        await course.addTeacher(teacher);
        res.json({ success: true, message: 'Enseignant attribué au cours' });
    } catch (error) { next(error); }
};

// Retirer un enseignant d’un cours
export const removeTeacher = async (req, res, next) => {
    try {
        const { courseId, teacherId } = req.params;
        const course = await Course.findByPk(courseId);
        const teacher = await Teacher.findByPk(teacherId);
        if (!course || !teacher) return res.status(404).json({ success: false, error: 'Cours ou enseignant non trouvé' });
        await course.removeTeacher(teacher);
        res.json({ success: true, message: 'Enseignant retiré du cours' });
    } catch (error) { next(error); }
};