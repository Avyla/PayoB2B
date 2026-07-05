import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import transactionRoutes from './routes/transaction.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import whatsappLinksRoutes from './routes/whatsapp-links.routes';
import dashboardRoutes from './routes/dashboard.routes';
import authRoutes from './routes/auth.routes';
import emailRoutes from './modules/email-integration/email.routes';
import reportRoutes from './routes/report.routes';
import cronRoutes from './routes/cron.routes';
import { prisma } from './models/db';
import { hashPassword } from './utils/auth';
import { Rol } from '@prisma/client';
import { webhookController } from './controllers/webhook.controller';
import { gmailPubSubService } from './services/gmail-pubsub.service';

const app = express();

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/whatsapp-links', whatsappLinksRoutes);
app.use('/api/v1/email', emailRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/cron', cronRoutes);

app.post('/api/v1/webhooks/gmail', webhookController.handleGmailPush);

import { globalErrorHandler } from './middlewares/error.middleware';

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use(globalErrorHandler);

const seedDatabase = async () => {
  try {
    const adminUser = await prisma.usuario.findUnique({
      where: { email: 'admin@payo.com' },
    });
    if (!adminUser) {
      console.log('🌱 Creating default admin user (admin@payo.com)...');
      let comercio = await prisma.comercio.findFirst();
      if (!comercio) {
        comercio = await prisma.comercio.create({
          data: {
            nombre_comercio: 'Payo Store',
            nit_identificacion: '900123456-1',
          },
        });
      }
      const passwordHash = await hashPassword('admin123');
      await prisma.usuario.create({
        data: {
          id_comercio: comercio.id_comercio,
          email: 'admin@payo.com',
          nombre_completo: 'System Administrator',
          rol: Rol.ADMINISTRADOR,
          password_hash: passwordHash,
        },
      });
      console.log('✅ Admin user ready: admin@payo.com / admin123');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

import { WhatsAppFirewall } from './services/whatsapp-firewall.service';

const startServer = async () => {
  await seedDatabase();
  await WhatsAppFirewall.initialize();

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
};

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
