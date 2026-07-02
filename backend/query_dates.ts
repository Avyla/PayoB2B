import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaccion.findMany({
    select: {
      id_transaccion: true,
      fecha_creacion: true,
      fecha_transaccion: true,
    }
  });
  console.log("Transactions in DB:");
  txs.forEach(tx => {
    console.log(`ID: ${tx.id_transaccion}, Creacion: ${tx.fecha_creacion.toISOString()}, Transaccion: ${tx.fecha_transaccion?.toISOString()}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
