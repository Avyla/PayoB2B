import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GmailPubSubService {
  private oauth2Client;
  // TODO: Cambiar a process.env.PUBSUB_TOPIC_NAME
  private topicName = process.env.PUBSUB_TOPIC_NAME || 'projects/payo-500801/topics/payo-gmail-topic';

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
  }

  /**
   * Activa las notificaciones Push para un correo (Watch)
   */
  public async activarWatch(emailAddress: string): Promise<void> {
    const conexion = await prisma.conexionGmail.findUnique({
      where: { email_conectado: emailAddress }
    });

    if (!conexion || !conexion.refresh_token) {
      throw new Error('La cuenta de correo no existe o no tiene token.');
    }

    this.oauth2Client.setCredentials({
      refresh_token: conexion.refresh_token,
      access_token: conexion.access_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const watchRes = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          labelIds: ['INBOX'],
          topicName: this.topicName
        }
      });

      const expiration = new Date(Number(watchRes.data.expiration));
      const historyId = watchRes.data.historyId?.toString();

      await prisma.conexionGmail.update({
        where: { email_conectado: emailAddress },
        data: {
          gmail_watch_expires_at: expiration,
          ...(historyId && !conexion.gmail_history_id ? { gmail_history_id: historyId } : {})
        }
      });

      console.log(`[PubSub] Watch activado para ${emailAddress}. Expira: ${expiration}`);
    } catch (error) {
      console.error(`[PubSub] Error activando watch para ${emailAddress}:`, error);
    }
  }

  /**
   * Renueva el Watch para todos los comercios donde esté a punto de expirar (menos de 24h)
   */
  public async renovarWatches(): Promise<void> {
    const unDiaDespues = new Date();
    unDiaDespues.setDate(unDiaDespues.getDate() + 1);

    const conexionesPorRenovar = await prisma.conexionGmail.findMany({
      where: {
        estado: true,
        OR: [
          { gmail_watch_expires_at: { lt: unDiaDespues } },
          { gmail_watch_expires_at: null }
        ]
      }
    });

    for (const conexion of conexionesPorRenovar) {
      await this.activarWatch(conexion.email_conectado);
    }
  }
}

export const gmailPubSubService = new GmailPubSubService();
