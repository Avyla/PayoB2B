import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 5) {
    console.log('Usage: ts-node create-comercio.ts <nombre_comercio> <nit> <admin_email> <admin_password> <admin_name>');
    console.log('Example: npx ts-node scripts/create-comercio.ts "Mi Comercio" "900123456" "admin@example.com" "secure123" "Juan Perez"');
    process.exit(1);
  }

  const [nombre_comercio, nit_identificacion, email, password, nombre_completo] = args;

  try {
    const password_hash = await hashPassword(password);

    const comercio = await prisma.comercio.create({
      data: {
        nombre_comercio,
        nit_identificacion,
        usuarios: {
          create: {
            email,
            nombre_completo,
            password_hash,
            rol: 'ADMINISTRADOR',
          },
        },
      },
      include: {
        usuarios: true,
      },
    });

    console.log('✅ Comercio and Admin created successfully:');
    console.log(`Comercio ID: ${comercio.id_comercio}`);
    console.log(`Admin User ID: ${comercio.usuarios[0].id_usuario}`);
    console.log(`Admin Email: ${comercio.usuarios[0].email}`);
  } catch (error) {
    console.error('❌ Failed to create comercio:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
