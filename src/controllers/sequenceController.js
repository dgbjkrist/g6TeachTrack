import db from '../models/index.js';

const Sequence = db.Sequence;
const Course = db.Course;

export const getSequencesByCourse = async (req, res, next) => {
    try {
        const sequences = await Sequence.findAll({
            where: { course_id: req.params.courseId },
            order: [['ordre', 'ASC']]
        });
        res.json({ success: true, data: sequences });
    } catch (error) { next(error); }
};

export const createSequence = async (req, res, next) => {
    try {
        const { course_id, titre, ordre } = req.body;
        const course = await Course.findByPk(course_id);
        if (!course) return res.status(404).json({ success: false, error: 'Cours non trouvé' });
        const sequence = await Sequence.create({ titre, ordre, course_id });
        res.status(201).json({ success: true, data: sequence });
    } catch (error) { next(error); }
};

export const updateSequence = async (req, res, next) => {
    try {
        const sequence = await Sequence.findByPk(req.params.id);
        if (!sequence) return res.status(404).json({ success: false, error: 'Séquence non trouvée' });
        await sequence.update(req.body);
        res.json({ success: true, data: sequence });
    } catch (error) { next(error); }
};

export const deleteSequence = async (req, res, next) => {
    try {
        const sequence = await Sequence.findByPk(req.params.id);
        if (!sequence) return res.status(404).json({ success: false, error: 'Séquence non trouvée' });
        await sequence.destroy();
        res.json({ success: true, message: 'Séquence supprimée' });
    } catch (error) { next(error); }
};