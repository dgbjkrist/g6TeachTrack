import { Router } from 'express';
import authRoutes from './authRoutes.js';
import teacherRoutes from './teacherRoutes.js';
import courseRoutes from './courseRoutes.js';
import sequenceRoutes from './sequenceRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import activityRoutes from './activityRoutes.js';
import hourRoutes from './hourRoutes.js';
import reportRoutes from './reportRoutes.js';
import settingRoutes from './settingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import academicYearRoutes from './academicYearRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teachers', teacherRoutes);
router.use('/courses', courseRoutes);

router.use('/sequences', sequenceRoutes);
router.use('/resources', resourceRoutes);

router.use('/activities', activityRoutes);
router.use('/hours', hourRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/uploads', uploadRoutes);

router.get('/test', (req, res) => {
    res.json({ success: true, message: 'API fonctionne' });
});

export default router;