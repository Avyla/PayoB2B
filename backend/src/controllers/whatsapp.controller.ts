import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';
import { uploadImageToGCS } from '../services/gcs.service';
import { processReceiptAndCreateTransaction } from '../services/transaction.service';
import { prisma } from '../models/db';
import { CanalIngreso } from '@prisma/client';
import { WhatsAppFirewall } from '../services/whatsapp-firewall.service';
import { logger } from '../utils/logger';

// ---------------------------------------------------------------------------
// Tipos del payload de Evolution API
// ---------------------------------------------------------------------------

interface EvolutionMessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
}

interface EvolutionImageMessage {
  mimetype: string;
  caption?: string;
}

interface EvolutionMessageContent {
  imageMessage?: EvolutionImageMessage;
}

interface EvolutionMessageData {
  key: EvolutionMessageKey;
  message: EvolutionMessageContent;
  messageType: string;
  messageTimestamp: number;
  pushName?: string;
}

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: EvolutionMessageData;
  sender: string;
}

// ---------------------------------------------------------------------------
// Descarga de media desde Evolution API
// ---------------------------------------------------------------------------

/**
 * Descarga una imagen de WhatsApp usando el endpoint base64 de Evolution API.
 * Evolution API requiere el mensaje completo (key + message) para recuperar el media.
 */
const downloadEvolutionMedia = async (
  instanceName: string,
  messageData: EvolutionMessageData
): Promise<{ buffer: Buffer; mimetype: string }> => {
  const url = `${env.EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`;

  const response = await axios.post<{ base64: string; mimetype: string }>(
    url,
    {
      message: {
        key: messageData.key,
        message: messageData.message,
      },
      convertToMp4: false,
    },
    {
      headers: {
        apikey: env.EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    }
  );

  const { base64, mimetype } = response.data;
  const buffer = Buffer.from(base64, 'base64');
  return { buffer, mimetype };
};

// ---------------------------------------------------------------------------
// Extrae el número de teléfono limpio desde el JID de WhatsApp
// Ejemplo: "573001234567@s.whatsapp.net" → "573001234567"
// ---------------------------------------------------------------------------
const extractPhoneNumber = (sender: string): string =>
  sender.split('@')[0] ?? sender;

// ---------------------------------------------------------------------------
// Handlers de la ruta /api/v1/whatsapp/webhook
// ---------------------------------------------------------------------------

/**
 * GET /webhook — Compatibilidad con verificación de Meta (no necesaria para Evolution API,
 * pero se mantiene para facilitar migración futura a la API oficial).
 */
export const verifyWebhook = (req: Request, res: Response, next: NextFunction): void => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    logger.info('[WhatsApp] Webhook Meta verificado');
    res.status(200).send(challenge);
  } else {
    throw new AppError('No tienes los permisos necesarios para realizar esta acción.', 403, 'FORBIDDEN_ACTION');
  }
};

/**
 * POST /webhook — Recibe eventos de Evolution API.
 *
 * Solo procesa el evento "messages.upsert" con messageType "imageMessage".
 * Responde 200 inmediatamente (ACK) y procesa en background para no bloquear.
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  logger.info(`[WhatsApp] WEBHOOK RECIBIDO de: ${req.body?.sender || 'desconocido'}`);

  // ACK inmediato — Evolution API reintenta si no recibe 200
  res.status(200).json({ status: 'received' });

  const payload = req.body as EvolutionWebhookPayload;

  // Ignorar eventos que no son mensajes entrantes con imágenes
  if (
    payload.event !== 'messages.upsert' ||
    payload.data?.messageType !== 'imageMessage' ||
    payload.data?.key?.fromMe === true
  ) {
    return;
  }

  const phoneNumber = extractPhoneNumber(payload.data.key.remoteJid);
  const instanceName = payload.instance;
  const messageData = payload.data;

  logger.info(`[WhatsApp] Imagen recibida de ${phoneNumber} en instancia "${instanceName}"`);

  try {
    // 1. Zero-Trust Firewall (Validación en Memoria < 1ms)
    const isAuthorized = WhatsAppFirewall.isAuthorized(phoneNumber);

    if (!isAuthorized) {
      logger.warn(`[Firewall] ⛔ Bloqueado spam de WhatsApp no registrado: ${phoneNumber}`);
      // Terminamos el flujo sin tocar la Base de Datos ni invocar Google Cloud
      return;
    }

    // Buscamos el id_comercio para asociar la transacción. 
    // Dado que el firewall garantizó su existencia, la query es segura.
    const numeroVinculado = await prisma.numeroWhatsApp.findFirst({
      where: { numero: phoneNumber },
      select: { id_comercio: true }
    });

    if (!numeroVinculado) return; // Fallback extremo por si hay desincronización


    // 2. Descargar imagen desde Evolution API
    const { buffer, mimetype } = await downloadEvolutionMedia(instanceName, messageData);

    // 3. Subir imagen a Google Cloud Storage
    const fileExt = mimetype.includes('png') ? 'png' : 'jpg';
    const fileName = `wa_${messageData.key.id}.${fileExt}`;
    const url_imagen_gcs = await uploadImageToGCS(buffer, fileName, mimetype);

    // 4. OCR + Parser + guardar transacción en PostgreSQL
    await processReceiptAndCreateTransaction({
      id_comercio: numeroVinculado.id_comercio,
      id_usuario_creador: undefined, // Transacción creada automáticamente por el bot
      url_imagen_gcs,
      canal_ingreso: CanalIngreso.WHATSAPP,
      numero_whatsapp_origen: phoneNumber,
      imageBuffer: buffer,
    });

    logger.info(`[WhatsApp] ✅ Comprobante de ${phoneNumber} procesado correctamente`);
  } catch (err) {
    // Degradación grácil: loguea el error sin crashear el servidor
    const errMessage = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    logger.error(`[WhatsApp] ❌ Error procesando comprobante de ${phoneNumber}: ${errMessage}`, { stack: errStack });
  }
};
