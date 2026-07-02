import { Request, Response } from 'express';
import { GmailService } from './gmail.service';
import { AuthenticatedRequest } from '../../middlewares/tenant.middleware';
import { prisma } from '../../models/db';
import { EmailParserService } from './email-parser.service';
import { MatchService } from '../../services/match.service';

const gmailService = new GmailService();

export class EmailController {
  
  /**
   * GET /api/email/auth-url
   * Genera y devuelve la URL para autenticarse con Gmail
   */
  public getAuthUrl = (req: AuthenticatedRequest, res: Response): void => {
    try {
      const idComercio = req.tenantId;
      
      if (!idComercio) {
        res.status(400).json({ error: 'No autorizado' });
        return;
      }

      const url = gmailService.getAuthUrl(idComercio);
      res.json({ url });
    } catch (error) {
      console.error('Error generando auth URL:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * GET /api/email/callback
   * Callback de OAuth de Google (no usa tenantMiddleware porque viene de Google)
   */
  public oauthCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const code = req.query.code as string;
      const idComercio = req.query.state as string;

      if (!code || !idComercio) {
        res.status(400).json({ error: 'Parámetros code o state (id_comercio) faltantes' });
        return;
      }

      await gmailService.handleCallback(code, idComercio);
      
      res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <h2>✅ Conexión exitosa</h2>
            <p>El correo se ha vinculado a tu comercio.</p>
            <p>Puedes cerrar esta pestaña y volver a Payo.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error en oauth callback:', error);
      res.status(500).send('Error procesando el callback de OAuth');
    }
  };

  /**
   * GET /api/email/status
   * Obtiene el estado de conexión a Gmail del comercio actual
   */
  public getStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const idComercio = req.tenantId;
      
      if (!idComercio) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const conexiones = await prisma.conexionGmail.findMany({
        where: { id_comercio: idComercio, estado: true }
      });

      if (conexiones.length === 0) {
        res.json({ connected: false, accounts: [] });
        return;
      }

      const accounts = conexiones.map(c => c.email_conectado);
      res.json({ connected: true, accounts });
    } catch (error) {
      console.error('Error en get status:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * DELETE /api/email/disconnect
   * Desvincula una cuenta de Gmail
   */
  public disconnectEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const idComercio = req.tenantId;
      const email = req.query.email as string;
      
      if (!idComercio) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }
      if (!email) {
        res.status(400).json({ error: 'Email es requerido' });
        return;
      }

      await gmailService.disconnectEmail(idComercio, email);
      res.json({ success: true, message: 'Cuenta desvinculada exitosamente' });
    } catch (error: any) {
      console.error('Error desvinculando correo:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  /**
   * POST /api/email/sync
   * Fuerza la sincronización de correos de un comercio
   */
  public syncEmails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const idComercio = req.tenantId;

      if (!idComercio) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const procesados = await gmailService.syncEmails(idComercio);
      
      res.json({ 
        success: true, 
        message: `Sincronización completada. Se procesaron ${procesados} correos nuevos.` 
      });
    } catch (error: any) {
      console.error('Error en sync emails:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  /**
   * GET /api/v1/email/pendientes
   * Obtiene la lista de correos bancarios huérfanos pendientes de cruce
   */
  public getPendingEmails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const idComercio = req.tenantId;

      if (!idComercio) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const pendingEmails = await prisma.alertaEmail.findMany({
        where: {
          id_comercio: idComercio,
          estado_cruce: 'PENDIENTE'
        },
        select: {
          id_alerta: true,
          banco: true,
          monto: true,
          referencia: true,
          nombre_remitente: true,
          remitente_original: true,
          asunto: true,
          fecha_hora_transaccion: true,
          fecha_alerta: true,
          estado_cruce: true,
        },
        orderBy: { fecha_alerta: 'desc' }
      });

      res.json({ data: pendingEmails });
    } catch (error: any) {
      console.error('Error fetching pending emails:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * GET /api/v1/email/dlq
   * Obtiene la lista de correos que no pudieron ser parseados (Dead Letter Queue)
   */
  public getDlqEmails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const idComercio = req.tenantId;
      if (!idComercio) { res.status(401).json({ error: 'No autorizado' }); return; }

      const dlqEmails = await prisma.alertaEmail.findMany({
        where: { id_comercio: idComercio, estado_cruce: 'ERROR_PARSEO' },
        orderBy: { fecha_creacion: 'desc' }
      });

      res.json({ data: dlqEmails });
    } catch (error: any) {
      console.error('Error fetching DLQ emails:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * POST /api/v1/email/dlq/:id/reprocess
   * Reprocesa un correo con la IA
   */
  public reprocessDlq = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const idComercio = req.tenantId;
      const id = req.params.id as string;

      if (!idComercio) { res.status(401).json({ error: 'No autorizado' }); return; }

      const alerta = await prisma.alertaEmail.findFirst({
        where: { id_alerta: id, id_comercio: idComercio, estado_cruce: 'ERROR_PARSEO' }
      });

      if (!alerta) {
        res.status(404).json({ error: 'Correo DLQ no encontrado' }); return;
      }

      // Reprocesar
      const parsedData = await EmailParserService.parse(alerta.html_original, '', '');

      if (parsedData && parsedData.success) {
        await prisma.alertaEmail.update({
          where: { id_alerta: id },
          data: {
            banco: parsedData.data.banco,
            monto: parsedData.data.monto,
            referencia: parsedData.data.referencia,
            nombre_remitente: parsedData.data.nombre_remitente,
            fecha_hora_transaccion: parsedData.data.fechaTransaccion,
            estado_cruce: 'PENDIENTE'
          }
        });
        
        const matchService = new MatchService();
        matchService.matchEmailAlert(alerta.id_alerta).catch(console.error);
        
        res.json({ success: true, message: 'Correo procesado exitosamente por IA' });
      } else {
        res.status(400).json({ error: 'La IA no pudo procesar este correo.' });
      }
    } catch (error: any) {
      console.error('Error reprocesando DLQ:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}
