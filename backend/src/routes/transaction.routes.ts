import { Router } from 'express';
import { uploadReceipt } from '../controllers/upload.controller';
import { getTransactions, updateTransactionStatus, linkEmailToTransaction, getTransactionSignedUrl } from '../controllers/transaction.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';
import { uploadRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();
// All routes here will be prefixed with /api/v1/transactions
router.get('/', tenantMiddleware, getTransactions);
router.get('/:id/image', tenantMiddleware, getTransactionSignedUrl);
router.patch('/:id', tenantMiddleware, updateTransactionStatus);
router.post('/:id/link-email', tenantMiddleware, linkEmailToTransaction);
router.post('/upload', uploadRateLimiter, tenantMiddleware, uploadReceipt);

export default router;
