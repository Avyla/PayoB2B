import { PrismaClient } from '@prisma/client';
import { gmailPubSubService } from '../src/services/gmail-pubsub.service';

const prisma = new PrismaClient();

async function main() {
  const comercios = await prisma.conexionGmail.findMany({ where: { estado: true } });
  for (const c of comercios) {
    console.log(`Activando Watch para comercio: ${c.id_comercio}...`);
    await gmailPubSubService.activarWatch(c.id_comercio);
  }
}
main().then(() => console.log('Done.')).catch(console.error).finally(() => prisma.$disconnect());
