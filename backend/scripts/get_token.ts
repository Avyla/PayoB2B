import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.usuario.findFirst();
  if (!user) {
    console.log('No user found in DB');
    return;
  }
  
  const token = jwt.sign(
    {
      id_usuario: user.id_usuario,
      id_comercio: user.id_comercio,
      email: user.email,
      rol: user.rol,
    },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  console.log(token);
}

main().catch(console.error).finally(() => prisma.$disconnect());
