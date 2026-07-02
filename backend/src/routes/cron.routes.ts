import { Router } from 'express';
import { cronController } from '../controllers/cron.controller';

const router = Router();

router.post('/reconcile', cronController.reconcile);

export default router;
