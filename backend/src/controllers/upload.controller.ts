import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import multer from 'multer';
import { uploadImageToGCS, generateSignedUrl } from '../services/gcs.service';
import { processReceiptAndCreateTransaction } from '../services/transaction.service';
import { AuthenticatedRequest } from '../middlewares/tenant.middleware';
import { CanalIngreso } from '@prisma/client';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
}).single('image');

export const uploadReceipt = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA'));
      }
      return next(new AppError('Error subiendo el archivo', 400, 'BAD_REQUEST_DATA'));
    }

    try {
      const file = req.file;
      const tenantId = req.tenantId;
      const userId = req.user?.id_usuario;

      if (!tenantId) {
        return next(new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA'));
      }

      if (!file) {
        return next(new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA'));
      }

      // T030: Validate MIME type — only JPG, PNG, WEBP allowed
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return next(new AppError(`Formato no soportado: "${file.mimetype}". Sube JPG, PNG o WEBP.`, 400, 'BAD_REQUEST_DATA'));
      }

      // Upload to GCS
      const url_imagen_gcs = await uploadImageToGCS(file.buffer, file.originalname, file.mimetype);

      // Process OCR and create transaction
      const { transaccion, isDuplicate } = await processReceiptAndCreateTransaction({
        id_comercio: tenantId,
        id_usuario_creador: userId,
        url_imagen_gcs,
        canal_ingreso: CanalIngreso.WEB,
        imageBuffer: file.buffer,
      });

      let transaccionSigned = transaccion;
      if (transaccion) {
        const signedUrl = await generateSignedUrl(transaccion.url_imagen_gcs);
        transaccionSigned = { ...transaccion, url_imagen_gcs: signedUrl };
      }

      return res.status(201).json({
        message: isDuplicate 
          ? '⚠️ Comprobante duplicado detectado y enviado a cuarentena.' 
          : 'Receipt uploaded and processed successfully',
        transaccion: transaccionSigned,
        isDuplicate,
      });
    } catch (error) {
      return next(error);
    }
  });
};

