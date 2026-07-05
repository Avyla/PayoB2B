import { prisma } from './src/models/db';

async function main() {
  const alertas = await prisma.alertaEmail.findMany({
    where: { estado_cruce: 'PENDIENTE' }
  });

  for (const alerta of alertas) {
    if (alerta.fecha_hora_transaccion) {
      // Add 5 hours to fix the UTC timezone offset bug
      const fixedDate = new Date(alerta.fecha_hora_transaccion.getTime() + (5 * 60 * 60 * 1000));
      await prisma.alertaEmail.update({
        where: { id_alerta: alerta.id_alerta },
        data: { fecha_hora_transaccion: fixedDate }
      });
      console.log(`Alerta ${alerta.id_alerta} updated date to ${fixedDate.toISOString()}`);
    }
  }

  // Ahora corremos el match para la transacción pendiente
  const transaccion = await prisma.transaccion.findFirst({
    where: { estado: 'SUBIDO_SIN_VERIFICAR' },
    orderBy: { fecha_creacion: 'desc' }
  });

  if (transaccion) {
    console.log(`Intentando cruzar tx ${transaccion.id_transaccion} con alertas corregidas...`);
    const { MatchService } = await import('./src/services/match.service');
    const matchService = new MatchService();
    const result = await matchService.matchTransaction(transaccion.id_transaccion);
    console.log(`Match result: ${result}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
