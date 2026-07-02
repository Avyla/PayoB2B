import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return val;
}

export const env = {
  PORT: process.env['PORT'] ?? '3001',
  NODE_ENV: (process.env['NODE_ENV'] ?? 'development') as 'development' | 'production' | 'test',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  GCP_PROJECT_ID: process.env['GCP_PROJECT_ID'] ?? '',
  GCS_BUCKET_NAME: process.env['GCS_BUCKET_NAME'] ?? '',
  GCP_VISION_KEY_PATH: process.env['GCP_VISION_KEY_PATH'] ?? './gcp-vision-key.json',
  GCP_STORAGE_KEY_PATH: process.env['GCP_STORAGE_KEY_PATH'] ?? './gcp-storage-key.json',
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env['WHATSAPP_WEBHOOK_VERIFY_TOKEN'] ?? '',
  WHATSAPP_API_TOKEN: process.env['WHATSAPP_API_TOKEN'] ?? '',
  // Evolution API (unofficial WhatsApp — desarrollo local)
  EVOLUTION_API_URL: process.env['EVOLUTION_API_URL'] ?? 'http://localhost:8080',
  EVOLUTION_API_KEY: process.env['EVOLUTION_API_KEY'] ?? '',
  RESEND_API_KEY: process.env['RESEND_API_KEY'] ?? '',
  RESEND_FROM_EMAIL: process.env['RESEND_FROM_EMAIL'] ?? 'Payo Soporte <onboarding@resend.dev>',
  FRONTEND_URL: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
  CRON_SECRET_TOKEN: process.env['CRON_SECRET_TOKEN'] ?? '',
} as const;
