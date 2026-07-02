import { Request, Response } from 'express';
import multer from 'multer';
import { uploadImageToGCS, generateSignedUrl } from '../services/gcs.service';
import { processReceiptAndCreateTransaction } from '../services/transaction.service';
import { AuthenticatedRequest } from '../middlewares/tenant.middleware';
import { CanalIngreso } from '@prisma/client';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
}).single('image');

export const uploadReceipt = (req: AuthenticatedRequest, res: Response) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Unexpected field. Please ensure the file is uploaded under the "image" key.' });
      }
      return res.status(400).json({ error: 'File upload error', details: err.message });
    }

    try {
      const file = req.file;
      const tenantId = req.tenantId;
      const userId = req.user?.id_usuario;

      if (!tenantId) {
        return res.status(401).json({ error: 'Tenant ID missing' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      // T030: Validate MIME type — only JPG, PNG, WEBP allowed
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(415).json({
          error: `Unsupported file format: "${file.mimetype}". Please upload a valid image (JPG, PNG, or WEBP).`,
        });
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
      console.error('Upload Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error processing receipt',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
};

