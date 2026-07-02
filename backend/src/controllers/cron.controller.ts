import { Request, Response } from 'express';
import { env } from '../config/env';
import { gmailPubSubService } from '../services/gmail-pubsub.service';
import { logger } from '../utils/logger';

class CronController {
  public async reconcile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.header('X-Scheduler-Token');
      
      if (!token || token !== env.CRON_SECRET_TOKEN) {
        logger.warn(`Unauthorized cron access attempt with token: ${token}`);
        res.status(401).json({ error: 'Unauthorized cron access' });
        return;
      }

      logger.info('[Cron] Starting Gmail Watches renewal initiated by Cloud Scheduler...');
      await gmailPubSubService.renovarWatches();
      logger.info('[Cron] Gmail Watches renewal completed successfully.');

      res.status(200).json({ message: 'Cron job executed successfully' });
    } catch (error) {
      logger.error(`[Cron] Error executing reconcile cron job:`, error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export const cronController = new CronController();
