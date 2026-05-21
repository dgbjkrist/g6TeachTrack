import { Router } from 'express';
import { getAllPayments, generatePayment, updatePaymentStatus, deletePayment } from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/auth.js';
import { isSecretaireOrAdmin, isAdmin } from '../middleware/roleCheck.js';

const router = Router();
router.use(verifyToken, isSecretaireOrAdmin);

router.get('/', getAllPayments);
router.post('/generate', generatePayment);
router.put('/:id', updatePaymentStatus);
router.delete('/:id', isAdmin, deletePayment);

export default router;