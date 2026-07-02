import { Router } from 'express';
import { EmailController } from './email.controller';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';

const router = Router();
const controller = new EmailController();

// Rutas protegidas por middleware multi-tenant (JWT)
router.get('/auth-url', tenantMiddleware, controller.getAuthUrl);
router.get('/status', tenantMiddleware, controller.getStatus);
router.post('/sync', tenantMiddleware, controller.syncEmails);
router.get('/pendientes', tenantMiddleware, controller.getPendingEmails);
router.get('/dlq', tenantMiddleware, controller.getDlqEmails);
router.post('/dlq/:id/reprocess', tenantMiddleware, controller.reprocessDlq);
router.delete('/disconnect', tenantMiddleware, controller.disconnectEmail);

// Callback público de Google
router.get('/callback', controller.oauthCallback);

export default router;
