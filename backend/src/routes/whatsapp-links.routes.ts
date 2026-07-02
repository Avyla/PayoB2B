import { Router } from 'express';
import { getLinkedNumbers, addLinkedNumber, removeLinkedNumber } from '../controllers/whatsapp-links.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);

router.get('/', getLinkedNumbers);
router.post('/', addLinkedNumber);
router.delete('/:id', removeLinkedNumber);

export default router;
