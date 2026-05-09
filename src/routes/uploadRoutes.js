import { Router } from 'express';
import { uploadFile, handleUpload } from '../controllers/uploadController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Route protégée : seuls les utilisateurs authentifiés peuvent uploader
router.post('/', verifyToken, uploadFile, handleUpload);

export default router;