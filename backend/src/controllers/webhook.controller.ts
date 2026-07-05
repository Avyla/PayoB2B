import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { prisma } from '../models/db';
import { GmailService } from '../modules/email-integration/gmail.service';

const gmailService = new GmailService();

export class WebhookController {
  /**
   * POST /api/v1/webhooks/gmail
   * Endpoint público para recibir notificaciones Push de Google Pub/Sub
   */
  public handleGmailPush = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Pub/Sub envía el payload en req.body.message.data (Base64)
      const message = req.body.message;
      if (!message || !message.data) {
        throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
      }

      // 2. Decodificar Base64
      const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
      const payload = JSON.parse(decodedData);

      const emailAddress = payload.emailAddress;
      const historyId = payload.historyId;

      if (!emailAddress) {
        throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
      }

      console.log(`[Webhook] Notificación de Gmail recibida para: ${emailAddress} (historyId: ${historyId})`);

      // 3. Buscar el comercio correspondiente
      const conexion = await prisma.conexionGmail.findFirst({
        where: { email_conectado: emailAddress, estado: true }
      });

      if (!conexion) {
        console.warn(`[Webhook] No se encontró conexión activa para el email ${emailAddress}`);
        throw new AppError('El recurso solicitado no fue encontrado.', 404, 'RESOURCE_NOT_FOUND');
      }

      // 4. Mandar a sincronizar correos en segundo plano (no bloqueamos la respuesta a Google)
      // Usaremos el historyId para optimizar la lectura (fase de optimización)
      // Usaremos el historyId para optimizar la lectura (fase de optimización)
      gmailService.syncEmails(conexion.id_comercio, emailAddress).catch(err => {
        console.error(`[Webhook] Error sincronizando correos para ${conexion.id_comercio}:`, err);
      });

      // 5. Actualizar el history_id en BD
      await prisma.conexionGmail.update({
        where: { id_conexion: conexion.id_conexion },
        data: { gmail_history_id: historyId.toString() }
      });

      // 6. Responder 200 OK inmediatamente para que Google sepa que recibimos el mensaje
      res.status(200).send('OK');
    } catch (error) {
      next(error);
    }
  };
}

export const webhookController = new WebhookController();
