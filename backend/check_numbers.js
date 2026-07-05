const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const nums = await prisma.numeroWhatsApp.findMany();
  console.log("Números:", nums);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
