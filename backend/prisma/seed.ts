import { PrismaClient, Rol } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../src/utils/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding...');

  // Limpiar BD
  await prisma.transaccion.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.comercio.deleteMany();

  // Crear Comercio
  const comercio = await prisma.comercio.create({
    data: {
      nombre_comercio: 'Comercio de Prueba',
      nit_identificacion: '900123456-1',
    },
  });
  console.log('✅ Comercio creado:', comercio.id_comercio);

  // Crear Usuario Administrador
  const passwordHash = await bcrypt.hash('password123', 10);
  const admin = await prisma.usuario.create({
    data: {
      id_comercio: comercio.id_comercio,
      email: 'admin@prueba.com',
      nombre_completo: 'Admin Prueba',
      rol: Rol.ADMINISTRADOR,
      password_hash: passwordHash,
      telefono_whatsapp: '+573001234567',
    },
  });
  console.log('✅ Usuario Administrador creado:', admin.email);

  // Generar JWT
  const token = generateToken({ id_usuario: admin.id_usuario, id_comercio: admin.id_comercio, rol: admin.rol });
  console.log('\n======================================================');
  console.log('🔑 JWT TOKEN (Cópialo para las pruebas):');
  console.log(token);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeding:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
