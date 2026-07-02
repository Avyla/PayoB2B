import { prisma } from './backend/src/models/db';
async function main() {
  const tx = await prisma.transaccion.findMany({ orderBy: { fecha_creacion: 'desc' }, take: 2 });
  const alertas = await prisma.alertaEmail.findMany({ orderBy: { fecha_creacion: 'desc' }, take: 2 });
  console.log("LAST TXs:", JSON.stringify(tx, null, 2));
  console.log("LAST ALERTAS:", JSON.stringify(alertas, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
