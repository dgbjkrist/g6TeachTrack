import { Router } from 'express';
import { getAllPayments, previewPayment, generatePayment, recalculatePayment, updatePaymentStatus, deletePayment } from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin, isAdmin } from '../middleware/roleCheck.js';

const router = Router();
router.use(verifyToken, isSecretaireOrAdmin);

router.get('/', getAllPayments);
router.get('/preview', previewPayment);
router.post('/generate', generatePayment);
router.put('/:id/recalculate', recalculatePayment);
router.put('/:id', updatePaymentStatus);
router.delete('/:id', isAdmin, deletePayment);

export default router;