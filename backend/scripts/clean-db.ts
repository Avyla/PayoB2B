import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  const nominas = await prisma.alertaEmail.deleteMany({
    where: { 
      OR: [
        { html_original: { contains: 'nomina', mode: 'insensitive' } },
        { html_original: { contains: 'enviaste plata', mode: 'insensitive' } },
        { html_original: { contains: 'transferencia a', mode: 'insensitive' } },
        { estado_cruce: 'ERROR_PARSEO' }
      ]
    }
  });
  console.log(`Deleted ${nominas.count} bad/old records from AlertaEmail.`);
}
clean().catch(console.error).finally(() => prisma.$disconnect());
