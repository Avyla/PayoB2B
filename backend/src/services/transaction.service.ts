import { prisma } from '../models/db';
import { extractTextFromImage } from './ocr.service';
import { ReceiptParserDispatcher } from '../parsers';
import { EstadoTransaccion, CanalIngreso } from '@prisma/client';
import { MatchService } from './match.service';

const dispatcher = new ReceiptParserDispatcher();
const matchService = new MatchService();

export interface ProcessTransactionParams {
  id_comercio: string;
  id_usuario_creador?: string;
  url_imagen_gcs: string;
  canal_ingreso: CanalIngreso;
  numero_whatsapp_origen?: string;
  imageBuffer?: Buffer;
}

export interface TransactionResult {
  transaccion: Awaited<ReturnType<typeof prisma.transaccion.findUnique>>;
  isDuplicate: boolean;
}

export const processReceiptAndCreateTransaction = async (params: ProcessTransactionParams): Promise<TransactionResult> => {
  const { id_comercio, id_usuario_creador, url_imagen_gcs, canal_ingreso, numero_whatsapp_origen, imageBuffer } = params;

  let rawText = '';
  try {
    rawText = await extractTextFromImage(imageBuffer || url_imagen_gcs);
  } catch (error) {
    console.error('OCR failed, continuing with UNKNOWN state', error);
  }

  const parsedResult = dispatcher.parse(rawText);

  // T031: Duplicate detection — check same (referencia, banco, id_comercio)
  if (parsedResult.referencia && parsedResult.banco !== 'OTROS_BANCOS') {
    const existing = await prisma.transaccion.findFirst({
      where: {
        id_comercio,
        referencia: parsedResult.referencia,
        banco: parsedResult.banco,
      },
    });

    if (existing) {
      console.warn(`⚠️ Possible duplicate detected: referencia=${parsedResult.referencia}, banco=${parsedResult.banco}, id_comercio=${id_comercio}`);
      
      const duplicateTx = await prisma.transaccion.create({
        data: {
          id_comercio,
          id_usuario_creador,
          url_imagen_gcs,
          canal_ingreso,
          numero_whatsapp_origen,
          banco: parsedResult.banco,
          monto: parsedResult.monto,
          referencia: parsedResult.referencia,
          nombre_remitente_ocr: parsedResult.nombreRemitente,
          fecha_transaccion: parsedResult.fechaTransaccion,
          estado: EstadoTransaccion.DUPLICADO_SOSPECHOSO,
          duplicado_de_id: existing.id_transaccion,
          metadata_ocr: {
            rawText: parsedResult.rawText,
            confidenceScore: parsedResult.confidenceScore,
          },
        },
      });

      return { transaccion: duplicateTx, isDuplicate: true };
    }
  }

  let notas_revision: string | undefined = undefined;
  if (!rawText || parsedResult.banco === 'OTROS_BANCOS' || parsedResult.monto === null || !parsedResult.referencia) {
    notas_revision = 'Extracción no disponible';
  }

  const transaccion = await prisma.transaccion.create({
    data: {
      id_comercio,
      id_usuario_creador,
      url_imagen_gcs,
      canal_ingreso,
      numero_whatsapp_origen,
      banco: parsedResult.banco,
      monto: parsedResult.monto,
      referencia: parsedResult.referencia,
      nombre_remitente_ocr: parsedResult.nombreRemitente,
      fecha_transaccion: parsedResult.fechaTransaccion,
      estado: EstadoTransaccion.SUBIDO_SIN_VERIFICAR,
      notas_revision,
      metadata_ocr: {
        rawText: parsedResult.rawText,
        confidenceScore: parsedResult.confidenceScore,
      },
    },
  });

  prisma.logAuditoria.create({
    data: {
      id_comercio,
      id_usuario: id_usuario_creador || '00000000-0000-0000-0000-000000000000',
      nombre_usuario: id_usuario_creador ? 'Cajero/Admin Web' : 'Webhook WhatsApp',
      rol_usuario: id_usuario_creador ? 'HUMANO' : 'SISTEMA',
      accion: 'CREAR_TRANSACCION',
      id_transaccion: transaccion.id_transaccion,
      detalles: `Transacción creada desde ${canal_ingreso}${numero_whatsapp_origen ? ' (Origen: ' + numero_whatsapp_origen + ')' : ''}`,
    },
  }).catch(err => console.error('Error logging audit:', err));

  // T070: Intentar cruce automático en segundo plano
  matchService.matchTransaction(transaccion.id_transaccion).catch(console.error);

  return { transaccion, isDuplicate: false };
};

