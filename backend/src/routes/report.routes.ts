import { Router } from 'express';
import { getCierre, getAnomalias, getEficiencia } from '../controllers/report.controller';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const router = Router();

router.use(tenantMiddleware);

router.get('/cierre', getCierre);
router.get('/anomalias', getAnomalias);
router.get('/eficiencia', getEficiencia);

export default router;
