import { prisma } from './src/models/db';

async function main() {
  const transaccion = await prisma.transaccion.findFirst({
    orderBy: { fecha_creacion: 'desc' },
    select: { id_transaccion: true, fecha_transaccion: true }
  });
  const alerta = await prisma.alertaEmail.findFirst({
    orderBy: { fecha_creacion: 'desc' },
    select: { id_alerta: true, fecha_hora_transaccion: true }
  });
  
  console.log('Transaccion fecha:', transaccion?.fecha_transaccion?.toISOString());
  console.log('Alerta fecha:', alerta?.fecha_hora_transaccion?.toISOString());
}

main().catch(console.error).finally(() => prisma.$disconnect());
