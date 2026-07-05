import { Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { AuthenticatedRequest } from '../middlewares/tenant.middleware';
import { prisma } from '../models/db';
import { Banco, EstadoTransaccion } from '@prisma/client';
import { generateSignedUrl } from '../services/gcs.service';
import { MatchService } from '../services/match.service';
import { buildTransactionFilter } from '../utils/filter.builder';

const matchService = new MatchService();

export const getTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    const { limit = '50', offset = '0' } = req.query;

    const where = buildTransactionFilter(tenantId, req.query);

    const [transactions, total] = await Promise.all([
      prisma.transaccion.findMany({
        where,
        orderBy: { fecha_creacion: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: {
          creador: {
            select: { nombre_completo: true, email: true },
          },
          duplicado_de: true,
          alerta_email: {
            select: { 
              asunto: true, 
              remitente_original: true, 
              nombre_remitente: true,
              banco: true,
              monto: true,
              referencia: true,
              fecha_hora_transaccion: true
            }
          }
        },
      }),
      prisma.transaccion.count({ where }),
    ]);

    res.json({ data: transactions, total });
  } catch (error) {
    next(error);
  }
};

export const getTransactionSignedUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    const id = req.params.id as string;
    const transaction = await prisma.transaccion.findUnique({
      where: { id_transaccion: id },
      include: { duplicado_de: true },
    });

    if (!transaction || transaction.id_comercio !== tenantId) {
      throw new AppError('El recurso solicitado no fue encontrado.', 404, 'RESOURCE_NOT_FOUND');
    }

    const signedUrl = await generateSignedUrl(transaction.url_imagen_gcs);
    let duplicadoUrl = null;
    if (transaction.duplicado_de) {
      duplicadoUrl = await generateSignedUrl(transaction.duplicado_de.url_imagen_gcs);
    }

    res.json({ url: signedUrl, duplicadoUrl });
  } catch (error) {
    next(error);
  }
};

export const updateTransactionStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    const { id } = req.params;
    const { estado, notas_revision, banco, monto, referencia, fecha_transaccion } = req.body;

    if (!estado && !banco && monto === undefined && !referencia && !fecha_transaccion && notas_revision === undefined) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    // Verify ownership
    const transactionId = id as string;
    const transaction = await prisma.transaccion.findUnique({
      where: { id_transaccion: transactionId },
    });

    if (!transaction || transaction.id_comercio !== tenantId) {
      throw new AppError('El recurso solicitado no fue encontrado.', 404, 'RESOURCE_NOT_FOUND');
    }

    const dataToUpdate: any = {};
    if (estado) dataToUpdate.estado = estado as EstadoTransaccion;
    if (notas_revision !== undefined) dataToUpdate.notas_revision = notas_revision;
    if (banco) dataToUpdate.banco = banco as Banco;
    if (monto !== undefined) dataToUpdate.monto = Number(monto);
    if (referencia) dataToUpdate.referencia = referencia;
    if (fecha_transaccion) dataToUpdate.fecha_transaccion = new Date(fecha_transaccion);

    const updated = await prisma.transaccion.update({
      where: { id_transaccion: transactionId },
      data: dataToUpdate,
    });

    if (estado && estado !== transaction.estado) {
      prisma.logAuditoria.create({
        data: {
          id_comercio: tenantId,
          id_usuario: req.user?.id_usuario || 'SISTEMA',
          nombre_usuario: req.user?.nombre_completo || 'Usuario Desconocido',
          rol_usuario: req.user?.rol || 'SISTEMA',
          accion: estado === 'VERIFICADO_MANUAL' ? 'VERIFICAR_MANUAL' :
                  estado === 'RECHAZADO' ? 'RECHAZAR' :
                  estado === 'DUPLICADO_SOSPECHOSO' ? 'MARCAR_DUPLICADO' : 'ACTUALIZAR',
          id_transaccion: transactionId,
          detalles: `Cambió estado de ${transaction.estado} a ${estado}`
        }
      }).catch(err => console.error('Error logging audit:', err));
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const linkEmailToTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    const id = req.params.id as string;
    const { id_alerta_email } = req.body;

    if (!id_alerta_email) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    await matchService.manualMatch(id, id_alerta_email, tenantId);

    prisma.logAuditoria.create({
      data: {
        id_comercio: tenantId,
        id_usuario: req.user?.id_usuario || 'SISTEMA',
        nombre_usuario: req.user?.nombre_completo || 'Usuario Desconocido',
        rol_usuario: req.user?.rol || 'SISTEMA',
        accion: 'CRUCE_MANUAL',
        id_transaccion: id,
        detalles: `Vinculó manualmente comprobante con correo`
      }
    }).catch(err => console.error('Error logging audit:', err));

    res.json({ success: true, message: 'Correo vinculado exitosamente' });
  } catch (error: any) {
    next(new AppError(error.message || 'Error vinculando correo', 400, 'BAD_REQUEST_DATA'));
  }
};
