import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const transacciones = await prisma.transaccion.findMany({
    include: { alerta_email: true }
  });
  const alertas = await prisma.alertaEmail.findMany();
  
  console.log('Transacciones:');
  console.dir(transacciones, { depth: null });
  console.log('\nAlertas Email:');
  console.dir(alertas, { depth: null });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
