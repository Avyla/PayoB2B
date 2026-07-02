-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CAJERO', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "Banco" AS ENUM ('NEQUI', 'BANCOLOMBIA', 'OTROS_BANCOS');

-- CreateEnum
CREATE TYPE "CanalIngreso" AS ENUM ('WEB', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "EstadoTransaccion" AS ENUM ('SUBIDO_SIN_VERIFICAR', 'VERIFICADO_MANUAL', 'RECHAZADO');

-- CreateTable
CREATE TABLE "Comercios" (
    "id_comercio" UUID NOT NULL,
    "nombre_comercio" VARCHAR(150) NOT NULL,
    "nit_identificacion" VARCHAR(50) NOT NULL,
    "estado_activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_registro" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comercios_pkey" PRIMARY KEY ("id_comercio")
);

-- CreateTable
CREATE TABLE "Usuarios" (
    "id_usuario" UUID NOT NULL,
    "id_comercio" UUID NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "telefono_whatsapp" VARCHAR(20),
    "nombre_completo" VARCHAR(150) NOT NULL,
    "rol" "Rol" NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "fecha_registro" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Transacciones" (
    "id_transaccion" UUID NOT NULL,
    "id_comercio" UUID NOT NULL,
    "id_usuario_creador" UUID,
    "banco" "Banco" NOT NULL,
    "monto" DECIMAL(12,2),
    "referencia" VARCHAR(100),
    "fecha_transaccion" TIMESTAMPTZ,
    "url_imagen_gcs" TEXT NOT NULL,
    "canal_ingreso" "CanalIngreso" NOT NULL,
    "estado" "EstadoTransaccion" NOT NULL,
    "metadata_ocr" JSONB,
    "notas_revision" TEXT,
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transacciones_pkey" PRIMARY KEY ("id_transaccion")
);

-- CreateIndex
CREATE UNIQUE INDEX "Comercios_nit_identificacion_key" ON "Comercios"("nit_identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_email_key" ON "Usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_telefono_whatsapp_key" ON "Usuarios"("telefono_whatsapp");

-- CreateIndex
CREATE INDEX "Usuarios_telefono_whatsapp_idx" ON "Usuarios"("telefono_whatsapp");

-- CreateIndex
CREATE INDEX "Transacciones_id_comercio_fecha_creacion_idx" ON "Transacciones"("id_comercio", "fecha_creacion" DESC);

-- CreateIndex
CREATE INDEX "Transacciones_id_comercio_estado_idx" ON "Transacciones"("id_comercio", "estado");

-- CreateIndex
CREATE INDEX "Transacciones_id_comercio_referencia_idx" ON "Transacciones"("id_comercio", "referencia");

-- AddForeignKey
ALTER TABLE "Usuarios" ADD CONSTRAINT "Usuarios_id_comercio_fkey" FOREIGN KEY ("id_comercio") REFERENCES "Comercios"("id_comercio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacciones" ADD CONSTRAINT "Transacciones_id_comercio_fkey" FOREIGN KEY ("id_comercio") REFERENCES "Comercios"("id_comercio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacciones" ADD CONSTRAINT "Transacciones_id_usuario_creador_fkey" FOREIGN KEY ("id_usuario_creador") REFERENCES "Usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;
