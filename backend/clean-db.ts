import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpieza de la base de datos de producción...');
  
  // Truncar todas las tablas. CASCADE asegura que se eliminen registros de tablas dependientes.
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Transacciones", "Usuarios", "Comercios", "ConexionesGmail", "AlertasEmail", "NumerosWhatsApp", "LogsAuditoria" CASCADE;`);
  
  console.log('✅ Base de datos limpiada correctamente.');
}

main()
  .catch((e) => {
    console.error('Error al limpiar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
