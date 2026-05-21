import db from '../models/index.js';

const Course = db.Course;
const Teacher = db.Teacher;
const CourseTeacher = db.CourseTeacher;
const AcademicYear = db.AcademicYear;

// Lister les cours (pagination, filtres)
export const getAllCourses = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, filiere, niveau, academic_year_id } = req.query;
        const offset = (page - 1) * limit;
        const where = {};
        if (filiere) where.filiere = filiere;
        if (niveau) where.niveau = niveau;

        // Catalogue complet ; le filtre annee ne concerne que les attributions enseignants affichees
        const teacherInclude = academic_year_id
            ? { model: Teacher, as: 'teachers', required: false, through: { attributes: ['academic_year_id'], where: { academic_year_id } } }
            : { model: Teacher, as: 'teachers', required: false, through: { attributes: ['academic_year_id'] } };

        const { count, rows } = await Course.findAndCountAll({
            where,
            include: [teacherInclude],
            distinct: true,
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

// Attribuer à un enseignant un cours (estampillé avec l'année active)
export const assignTeacher = async (req, res, next) => {
    try {
        const { courseId, teacherId } = req.params;
        const course = await Course.findByPk(courseId);
        const teacher = await Teacher.findByPk(teacherId);
        if (!course || !teacher) return res.status(404).json({ success: false, error: 'Cours ou enseignant non trouvé' });

        const activeYear = await AcademicYear.findOne({ where: { is_active: true } });
        await course.addTeacher(teacher, {
            through: { academic_year_id: activeYear?.id ?? null }
        });
        res.json({
            success: true,
            message: 'Enseignant attribué au cours',
            academic_year: activeYear ? activeYear.year_label : null
        });
    } catch (error) { next(error); }
};

// Retirer un enseignant d'un cours (uniquement pour l'année active)
export const removeTeacher = async (req, res, next) => {
    try {
        const { courseId, teacherId } = req.params;
        const activeYear = await AcademicYear.findOne({ where: { is_active: true } });

        const deleted = await CourseTeacher.destroy({
            where: {
                course_id: courseId,
                teacher_id: teacherId,
                ...(activeYear ? { academic_year_id: activeYear.id } : {})
            }
        });

        if (!deleted) return res.status(404).json({ success: false, error: 'Attribution non trouvée pour l\'année active' });
        res.json({
            success: true,
            message: 'Enseignant retiré du cours',
            academic_year: activeYear?.year_label ?? null
        });
    } catch (error) { next(error); }
};

// Reconduire les attributions de l'année précédente vers l'année active
export const carryOverAttributions = async (req, res, next) => {
    try {
        const activeYear = await AcademicYear.findOne({ where: { is_active: true } });
        if (!activeYear) return res.status(400).json({ success: false, error: 'Aucune année académique active' });

        // Toutes les années triées par start_date pour trouver la précédente
        const allYears = await AcademicYear.findAll({ order: [['start_date', 'ASC']] });
        const activeIndex = allYears.findIndex((y) => y.id === activeYear.id);
        if (activeIndex <= 0) {
            return res.status(400).json({ success: false, error: 'Aucune année précédente trouvée' });
        }
        const prevYear = allYears[activeIndex - 1];

        // Attributions de l'année précédente
        const prevAttributions = await CourseTeacher.findAll({
            where: { academic_year_id: prevYear.id }
        });

        if (prevAttributions.length === 0) {
            return res.json({ success: true, created: 0, skipped: 0, message: "Aucune attribution à reconduire" });
        }

        let created = 0;
        let skipped = 0;
        for (const attr of prevAttributions) {
            const [, wasCreated] = await CourseTeacher.findOrCreate({
                where: { course_id: attr.course_id, teacher_id: attr.teacher_id, academic_year_id: activeYear.id },
                defaults: { course_id: attr.course_id, teacher_id: attr.teacher_id, academic_year_id: activeYear.id }
            });
            wasCreated ? created++ : skipped++;
        }

        res.json({
            success: true,
            created,
            skipped,
            message: `${created} attribution(s) reconduite(s), ${skipped} déjà existante(s)`,
            from_year: prevYear.year_label,
            to_year: activeYear.year_label
        });
    } catch (error) { next(error); }
};