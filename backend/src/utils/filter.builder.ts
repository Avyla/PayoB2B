import { Prisma, Banco, EstadoTransaccion } from '@prisma/client';

export const buildTransactionFilter = (tenantId: string, query: any): Prisma.TransaccionWhereInput => {
  const { fecha_inicio, fecha_fin, banco, origen, estado } = query;

  const where: Prisma.TransaccionWhereInput = {
    id_comercio: tenantId,
  };

  if (banco && banco !== 'Todos los bancos' && banco !== 'Todos') {
    where.banco = banco as Banco;
  }

  if (estado && estado !== 'Cualquier estado' && estado !== 'Todos') {
    where.estado = estado as EstadoTransaccion;
  }

  if (origen && origen !== 'Cualquier origen' && origen !== 'Todos') {
    where.numero_whatsapp_origen = origen as string;
  }

  if (fecha_inicio || fecha_fin) {
    const dateFilter: any = {};
    if (fecha_inicio) {
      dateFilter.gte = new Date(fecha_inicio as string);
    }
    if (fecha_fin) {
      dateFilter.lte = new Date(fecha_fin as string);
    }

    // Usar OR para buscar por fecha_transaccion (si existe) o fecha_creacion (si no hay fecha_transaccion)
    where.OR = [
      { fecha_transaccion: dateFilter },
      { 
        fecha_transaccion: null,
        fecha_creacion: dateFilter
      }
    ];
  }

  return where;
};
