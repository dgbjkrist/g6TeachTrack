import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { verifyToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', verifyToken, isAdmin, getSettings);
router.put('/', verifyToken, isAdmin, updateSettings);

export default router;