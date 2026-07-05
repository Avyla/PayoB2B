import { MatchService } from './src/services/match.service';
import { prisma } from './src/models/db';

async function main() {
  const transaccion = await prisma.transaccion.findFirst({
    orderBy: { fecha_creacion: 'desc' }
  });
  if (!transaccion) {
    console.log('No transaccion found');
    return;
  }
  
  console.log('Intentando cruzar tx:', transaccion.id_transaccion);

  const txDate = new Date(transaccion.fecha_transaccion!);
  const minutoInicio = new Date(txDate);
  minutoInicio.setSeconds(0, 0);
  const minutoFin = new Date(minutoInicio);
  minutoFin.setMinutes(minutoFin.getMinutes() + 1);

  console.log('Ventana de tiempo:', { minutoInicio, minutoFin });

  const bancosAceptables = [transaccion.banco];
  if (transaccion.banco === 'NEQUI') bancosAceptables.push('BANCOLOMBIA');
  if (transaccion.banco === 'BANCOLOMBIA') bancosAceptables.push('NEQUI');

  const whereConditions: any = {
    id_comercio: transaccion.id_comercio,
    banco: { in: bancosAceptables },
    monto: transaccion.monto,
    estado_cruce: 'PENDIENTE',
    fecha_hora_transaccion: {
      gte: minutoInicio,
      lt: minutoFin
    }
  };

  const alertas = await prisma.alertaEmail.findMany({
    where: whereConditions,
    orderBy: { fecha_alerta: 'desc' }
  });

  console.log('Alertas encontradas en query:', alertas.length);

  const matchService = new MatchService();
  const matched = await matchService.matchTransaction(transaccion.id_transaccion);
  console.log('Resultado del cruce final:', matched);
}

main().catch(console.error).finally(() => prisma.$disconnect());
