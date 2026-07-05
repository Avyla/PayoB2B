import { google } from 'googleapis';
import { prisma } from '../../models/db';
import { EmailParserService } from './email-parser.service';
import { MatchService } from '../../services/match.service';

const matchService = new MatchService();

export class GmailService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
  }

  /**
   * Genera la URL para que el usuario autorice el acceso a Gmail
   */
  public getAuthUrl(idComercio: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/gmail.modify'],
      state: idComercio // Pasamos el id_comercio para saber a quién asignarle el token en el callback
    });
  }

  /**
   * Procesa el código de autorización y guarda los tokens en la base de datos
   */
  public async handleCallback(code: string, idComercio: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Obtener el email del usuario para guardarlo
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const emailConectado = profile.data.emailAddress || '';

    // Guardar o actualizar la conexión en la BD usando email_conectado como única
    await prisma.conexionGmail.upsert({
      where: { email_conectado: emailConectado },
      update: {
        id_comercio: idComercio,
        refresh_token: tokens.refresh_token || '',
        access_token: tokens.access_token || '',
        estado: true,
      },
      create: {
        id_comercio: idComercio,
        email_conectado: emailConectado,
        refresh_token: tokens.refresh_token || '',
        access_token: tokens.access_token || '',
      },
    });
  }

  /**
   * Elimina una cuenta de Gmail de la BD y revoca su acceso en Google
   */
  public async disconnectEmail(idComercio: string, emailAddress: string): Promise<void> {
    const conexion = await prisma.conexionGmail.findUnique({
      where: { email_conectado: emailAddress }
    });

    if (!conexion || conexion.id_comercio !== idComercio) {
      throw new Error('Conexión no encontrada o no pertenece al comercio');
    }

    // Revocar token en Google
    if (conexion.refresh_token || conexion.access_token) {
      try {
        const tokenToRevoke = conexion.refresh_token || conexion.access_token;
        if (tokenToRevoke) {
          await this.oauth2Client.revokeToken(tokenToRevoke);
        }
      } catch (err) {
        console.warn(`[GmailService] Error al revocar token para ${emailAddress}, ignorando:`, err);
      }
    }

    // Hard Delete
    await prisma.conexionGmail.delete({
      where: { email_conectado: emailAddress }
    });
  }

  /**
   * Busca y procesa correos nuevos para un comercio (soporta multicuenta)
   */
  public async syncEmails(idComercio: string, emailAddress?: string): Promise<number> {
    let conexiones = [];

    if (emailAddress) {
      const conexion = await prisma.conexionGmail.findUnique({
        where: { email_conectado: emailAddress },
      });
      if (conexion && conexion.id_comercio === idComercio && conexion.estado) {
        conexiones.push(conexion);
      }
    } else {
      conexiones = await prisma.conexionGmail.findMany({
        where: { id_comercio: idComercio, estado: true },
      });
    }

    if (conexiones.length === 0) {
      throw new Error('El comercio no tiene conexiones de Gmail configuradas o activas.');
    }

    // Usar Promise.allSettled para resiliencia: si una cuenta falla, las demás se procesan
    const results = await Promise.allSettled(
      conexiones.map(conexion => this.syncSingleAccount(conexion))
    );

    let totalProcesados = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        totalProcesados += result.value;
      } else {
        console.error(`[GmailService] Error sincronizando una cuenta:`, result.reason);
      }
    }

    return totalProcesados;
  }

  private async syncSingleAccount(conexion: any): Promise<number> {
    if (!conexion.refresh_token) return 0;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: conexion.refresh_token,
      access_token: conexion.access_token,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    let messages: any[] = [];

    // T071: Optimización de consumo de API usando historyId (Pub/Sub Push)
    if (conexion.gmail_history_id) {
      try {
        const historyRes = await gmail.users.history.list({
          userId: 'me',
          startHistoryId: conexion.gmail_history_id,
          historyTypes: ['messageAdded']
        });

        if (historyRes.data.history) {
          for (const record of historyRes.data.history) {
            if (record.messagesAdded) {
              for (const msgAdded of record.messagesAdded) {
                if (msgAdded.message) {
                  messages.push(msgAdded.message);
                }
              }
            }
          }
        }
      } catch (err: any) {
        // Si el history_id caducó o hay error (ej: 404), caemos al fallback clásico
        console.warn(`[GmailService] Error con historyId ${conexion.gmail_history_id}, fallback a messages.list:`, err.message);
      }
    }

    // Fallback: Si no hay historyId o falló, hacemos la búsqueda tradicional
    if (messages.length === 0) {
      // T143: Solo procesar correos recibidos DESPUÉS de la fecha de vinculación para no saturar al cliente con historial antiguo
      const fechaVinculacionUnix = Math.floor(conexion.fecha_creacion.getTime() / 1000);
      const query = `is:unread after:${fechaVinculacionUnix} (from:bancolombia.com.co OR from:notificacionesbancolombia.com OR from:nequi.com.co) ("Recibiste plata" OR "Recibiste una transferencia" OR "Recibiste un pago")`;

      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50,
      });

      messages = listRes.data.messages || [];
    }
    let procesados = 0;

    for (const message of messages) {
      if (!message.id) continue;

      const msgData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      const headers = msgData.data.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const sender = headers.find((h: any) => h.name === 'From')?.value || '';
      
      // T126: Pre-Filtro Duro (Hard Filter)
      const senderLower = sender.toLowerCase();
      const isBankEmail = senderLower.includes('bancolombia.com.co') || 
                          senderLower.includes('notificacionesbancolombia.com') || 
                          senderLower.includes('nequi.com.co');
      
      if (!isBankEmail) {
        console.log(`[GmailService] Descartando correo de remitente no bancario: ${sender}`);
        // Remove label UNREAD para no procesarlo más y lo ignoramos
        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: { removeLabelIds: ['UNREAD'] }
        });
        continue;
      }
      
      // Extraer el texto del correo (puede venir en parts)
      let bodyData = '';
      if (msgData.data.payload?.parts) {
        // Buscar la parte de texto plano si existe
        const textPart = msgData.data.payload.parts.find((p: any) => p.mimeType === 'text/plain');
        if (textPart && textPart.body?.data) {
          bodyData = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        } else {
          // Si no hay texto plano, intentar con HTML
          const htmlPart = msgData.data.payload.parts.find((p: any) => p.mimeType === 'text/html');
          if (htmlPart && htmlPart.body?.data) {
            bodyData = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
          }
        }
      } else if (msgData.data.payload?.body?.data) {
        bodyData = Buffer.from(msgData.data.payload.body.data, 'base64').toString('utf-8');
      }

      const parseResult = await EmailParserService.parse(bodyData, sender, subject);

      if (parseResult && parseResult.success) {
        const parsedData = parseResult.data;
        // Evitar duplicados si el correo ya fue procesado antes y no se le quitó el unread
        const existe = await prisma.alertaEmail.findUnique({
          where: { email_message_id: message.id }
        });

        if (!existe) {
          const nuevaAlerta = await prisma.alertaEmail.create({
            data: {
              id_comercio: conexion.id_comercio,
              banco: parsedData.banco,
              monto: parsedData.monto,
              referencia: parsedData.referencia,
              nombre_remitente: parsedData.nombre_remitente,
              remitente_original: sender,
              asunto: subject,
              fecha_hora_transaccion: parsedData.fechaTransaccion,
              fecha_alerta: new Date(), // Fecha de lectura actual
              email_message_id: message.id,
              html_original: bodyData,
              estado_cruce: 'PENDIENTE',
            }
          });
          // T071: Intentar cruce automático en segundo plano
          matchService.matchEmailAlert(nuevaAlerta.id_alerta).catch(console.error);
          procesados++;
        }
      } else if (parseResult && !parseResult.success) {
        // T127: Descartar silenciosamente los resultados IGNORE (Ej: Nómina o Salientes) sin DLQ
        console.log(`[GmailService] Ignorando correo válido del banco por contexto: ${parseResult.reason}`);
      } else {
        // null: DLQ (Dead Letter Queue): El parser falló
        const existe = await prisma.alertaEmail.findUnique({
          where: { email_message_id: message.id }
        });

        if (!existe) {
          await prisma.alertaEmail.create({
            data: {
              id_comercio: conexion.id_comercio,
              banco: 'OTROS_BANCOS', 
              monto: 0,
              remitente_original: sender,
              asunto: subject,
              fecha_hora_transaccion: new Date(),
              fecha_alerta: new Date(),
              email_message_id: message.id,
              html_original: bodyData,
              estado_cruce: 'ERROR_PARSEO',
            }
          });
        }
      }

      // Quitar etiqueta UNREAD para no volver a procesarlo
      await gmail.users.messages.modify({
        userId: 'me',
        id: message.id,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
    }

    return procesados;
  }
}
