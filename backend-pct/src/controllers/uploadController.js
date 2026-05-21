import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `resource-${uniqueSuffix}${ext}`);
    }
});

// Filtre pour n'accepter que certains types (optionnel)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|avi|mov|webm/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = allowedTypes.test(file.mimetype);
    const extOk = allowedTypes.test(ext);
    if (mimeType || extOk) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non supporté'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB max

// Middleware pour un seul fichier (champ 'file')
export const uploadFile = upload.single('file');

// Fonction de réponse après upload
export const handleUpload = (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Aucun fichier envoyé' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            message: 'Fichier uploadé avec succès',
            url: fileUrl,
            originalName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        next(error);
    }
};