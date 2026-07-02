/*
  Warnings:

  - You are about to drop the column `telefono_whatsapp` on the `Usuarios` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoAlertaEmail" AS ENUM ('PENDIENTE', 'CONCILIADO', 'ERROR_PARSEO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoTransaccion" ADD VALUE 'DUPLICADO_SOSPECHOSO';
ALTER TYPE "EstadoTransaccion" ADD VALUE 'VERIFICADO_SISTEMA';

-- DropIndex
DROP INDEX "Usuarios_telefono_whatsapp_idx";

-- DropIndex
DROP INDEX "Usuarios_telefono_whatsapp_key";

-- AlterTable
ALTER TABLE "Transacciones" ADD COLUMN     "duplicado_de_id" UUID,
ADD COLUMN     "id_alerta_email" UUID,
ADD COLUMN     "nombre_remitente_ocr" VARCHAR(150),
ADD COLUMN     "numero_whatsapp_origen" VARCHAR(20);

-- AlterTable
ALTER TABLE "Usuarios" DROP COLUMN "telefono_whatsapp",
ADD COLUMN     "reset_password_expires" TIMESTAMPTZ,
ADD COLUMN     "reset_password_token" VARCHAR(255);

-- CreateTable
CREATE TABLE "ConexionesGmail" (
    "id_conexion" UUID NOT NULL,
    "id_comercio" UUID NOT NULL,
    "email_conectado" VARCHAR(150) NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "access_token" TEXT,
    "gmail_history_id" VARCHAR(255),
    "gmail_watch_expires_at" TIMESTAMPTZ,
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConexionesGmail_pkey" PRIMARY KEY ("id_conexion")
);

-- CreateTable
CREATE TABLE "AlertasEmail" (
    "id_alerta" UUID NOT NULL,
    "id_comercio" UUID NOT NULL,
    "banco" "Banco" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "referencia" VARCHAR(100),
    "nombre_remitente" VARCHAR(150),
    "remitente_original" VARCHAR(255),
    "asunto" VARCHAR(255),
    "fecha_hora_transaccion" TIMESTAMPTZ NOT NULL,
    "fecha_alerta" TIMESTAMPTZ NOT NULL,
    "email_message_id" VARCHAR(255) NOT NULL,
    "html_original" TEXT NOT NULL,
    "estado_cruce" "EstadoAlertaEmail" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertasEmail_pkey" PRIMARY KEY ("id_alerta")
);

-- CreateTable
CREATE TABLE "NumerosWhatsApp" (
    "id_numero" UUID NOT NULL,
    "id_comercio" UUID NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "etiqueta" VARCHAR(100),
    "fecha_registro" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NumerosWhatsApp_pkey" PRIMARY KEY ("id_numero")
);

-- CreateTable
CREATE TABLE "LogsAuditoria" (
    "id" UUID NOT NULL,
    "id_comercio" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "nombre_usuario" VARCHAR(150) NOT NULL,
    "rol_usuario" VARCHAR(50) NOT NULL,
    "accion" VARCHAR(100) NOT NULL,
    "id_transaccion" UUID,
    "detalles" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogsAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConexionesGmail_email_conectado_key" ON "ConexionesGmail"("email_conectado");

-- CreateIndex
CREATE UNIQUE INDEX "AlertasEmail_email_message_id_key" ON "AlertasEmail"("email_message_id");

-- CreateIndex
CREATE INDEX "AlertasEmail_id_comercio_referencia_idx" ON "AlertasEmail"("id_comercio", "referencia");

-- CreateIndex
CREATE UNIQUE INDEX "NumerosWhatsApp_numero_key" ON "NumerosWhatsApp"("numero");

-- CreateIndex
CREATE INDEX "NumerosWhatsApp_id_comercio_idx" ON "NumerosWhatsApp"("id_comercio");

-- CreateIndex
CREATE INDEX "LogsAuditoria_id_comercio_created_at_idx" ON "LogsAuditoria"("id_comercio", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "Transacciones" ADD CONSTRAINT "Transacciones_duplicado_de_id_fkey" FOREIGN KEY ("duplicado_de_id") REFERENCES "Transacciones"("id_transaccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacciones" ADD CONSTRAINT "Transacciones_id_alerta_email_fkey" FOREIGN KEY ("id_alerta_email") REFERENCES "AlertasEmail"("id_alerta") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConexionesGmail" ADD CONSTRAINT "ConexionesGmail_id_comercio_fkey" FOREIGN KEY ("id_comercio") REFERENCES "Comercios"("id_comercio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertasEmail" ADD CONSTRAINT "AlertasEmail_id_comercio_fkey" FOREIGN KEY ("id_comercio") REFERENCES "Comercios"("id_comercio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumerosWhatsApp" ADD CONSTRAINT "NumerosWhatsApp_id_comercio_fkey" FOREIGN KEY ("id_comercio") REFERENCES "Comercios"("id_comercio") ON DELETE CASCADE ON UPDATE CASCADE;
