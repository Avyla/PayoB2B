import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/tenant.middleware';
import { prisma } from '../models/db';
import { buildTransactionFilter } from '../utils/filter.builder';

export const getMetrics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Tenant ID is required' });
      return;
    }

    const where = buildTransactionFilter(tenantId, req.query);

    const metrics = await prisma.transaccion.groupBy({
      by: ['estado', 'banco'],
      where,
      _count: {
        id_transaccion: true,
      },
      _sum: {
        monto: true,
      },
    });

    let totalAmount = 0;
    let countPending = 0;
    let countVerified = 0;
    let countRejected = 0;
    let countNequi = 0;
    let countBancolombia = 0;
    let countOtrosBancos = 0;

    metrics.forEach((metric) => {
      const count = metric._count.id_transaccion;
      const amount = Number(metric._sum.monto) || 0;

      // Sum amount only if state is VERIFICADO_MANUAL, VERIFICADO_SISTEMA or SUBIDO_SIN_VERIFICAR
      if (metric.estado === 'VERIFICADO_MANUAL' || metric.estado === 'VERIFICADO_SISTEMA' || metric.estado === 'SUBIDO_SIN_VERIFICAR') {
        totalAmount += amount;
      }

      // Banco Distribution
      if (metric.banco === 'NEQUI') countNequi += count;
      else if (metric.banco === 'BANCOLOMBIA') countBancolombia += count;
      else if (metric.banco === 'OTROS_BANCOS') countOtrosBancos += count;

      if (metric.estado === 'VERIFICADO_MANUAL' || metric.estado === 'VERIFICADO_SISTEMA') {
        countVerified += count;
      } else if (metric.estado === 'SUBIDO_SIN_VERIFICAR') {
        countPending += count;
      } else if (metric.estado === 'RECHAZADO') {
        countRejected += count;
      } else if (metric.estado === 'DUPLICADO_SOSPECHOSO') {
        // Exclude duplicate suspected from the main counters, or maybe put them under rejected?
        // Let's add countDuplicates or just leave it for the separate UI.
      }
    });

    res.json({
      totalAmount,
      countPending,
      countVerified,
      countRejected,
      countNequi,
      countBancolombia,
      countOtrosBancos,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
