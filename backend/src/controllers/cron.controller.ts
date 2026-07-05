import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';
import { gmailPubSubService } from '../services/gmail-pubsub.service';
import { logger } from '../utils/logger';

class CronController {
  public async reconcile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.header('X-Scheduler-Token');
      
      if (!token || token !== env.CRON_SECRET_TOKEN) {
        throw new AppError('No tienes los permisos necesarios para realizar esta acción.', 403, 'FORBIDDEN_ACTION');
      }

      logger.info('[Cron] Starting Gmail Watches renewal initiated by Cloud Scheduler...');
      await gmailPubSubService.renovarWatches();
      logger.info('[Cron] Gmail Watches renewal completed successfully.');

      res.status(200).json({ message: 'Cron job executed successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const cronController = new CronController();
