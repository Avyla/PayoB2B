import { Router } from 'express';
import { getMetrics } from '../controllers/dashboard.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const router = Router();

router.get('/metrics', tenantMiddleware, getMetrics);

export default router;
