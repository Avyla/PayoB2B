import { Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { AuthenticatedRequest } from '../middlewares/tenant.middleware';
import { prisma } from '../models/db';
import { Prisma } from '@prisma/client';
import { buildTransactionFilter } from '../utils/filter.builder';

export const getCierre = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    const where = buildTransactionFilter(tenantId, req.query);

    const metrics = await prisma.transaccion.groupBy({
      by: ['banco', 'estado'],
      where,
      _sum: {
        monto: true,
      },
      _count: {
        id_transaccion: true,
      },
    });

    res.json({
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

export const getAnomalias = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    const where = buildTransactionFilter(tenantId, req.query);
    where.estado = {
      in: ['DUPLICADO_SOSPECHOSO', 'RECHAZADO'],
    };

    const countByEstado = await prisma.transaccion.groupBy({
      by: ['estado'],
      where,
      _count: {
        id_transaccion: true,
      },
    });

    const transacciones = await prisma.transaccion.findMany({
      where,
      orderBy: { fecha_creacion: 'desc' },
      take: 50,
      include: {
        alerta_email: true,
        creador: { select: { nombre_completo: true } },
      }
    });

    res.json({
      resumen: countByEstado,
      listado: transacciones,
    });
  } catch (error) {
    next(error);
  }
};

export const getEficiencia = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    const where = buildTransactionFilter(tenantId, req.query);

    const totalStats = await prisma.transaccion.groupBy({
      by: ['estado'],
      where,
      _count: {
        id_transaccion: true,
      },
    });

    let total = 0;
    let verificadoSistema = 0;

    totalStats.forEach((stat) => {
      total += stat._count.id_transaccion;
      if (stat.estado === 'VERIFICADO_SISTEMA') {
        verificadoSistema += stat._count.id_transaccion;
      }
    });

    const porcentajeAutomatizacion = total > 0 ? (verificadoSistema / total) * 100 : 0;

    res.json({
      total_transacciones: total,
      verificado_sistema: verificadoSistema,
      porcentaje_automatizacion: Number(porcentajeAutomatizacion.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
};
