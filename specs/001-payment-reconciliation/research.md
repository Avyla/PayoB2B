# Technical Research: Automatización de Conciliación de Comprobantes (Payo - Módulo 1)

## Architecture & Technology Stack Decisions

### 1. Backend Framework & Language

- **Decision**: Node.js con Express y TypeScript estricto (`tsc --noEmit`, sin `any`).
- **Rationale**: Proporciona alta velocidad de ejecución I/O para manejo de webhooks (WhatsApp Cloud API) y peticiones asíncronas hacia Google Cloud Storage y Vision API. La unificación de TypeScript garantiza type-safety completo.
- **Alternatives Considered**: Fastify (evaluado por rendimiento pero Express se eligió por madurez del ecosistema y compatibilidad inmediata con middleware de webhooks).

### 2. Multi-Tenant Database Architecture & Persistence

- **Decision**: PostgreSQL con cliente tipado (Prisma u ORM tipado) garantizando transacciones ACID.
- **Rationale**: Multi-tenancy implementado mediante aislamiento a nivel de fila (_row-level tenant isolation_) obligando la presencia del parámetro `id_comercio` en cada consulta y mutación. Las propiedades ACID aseguran la consistencia contable y evitan duplicidad de transacciones.
- **Alternatives Considered**: Esquema por inquilino (_schema-per-tenant_) o DB por inquilino (descartado por sobrecostos y complejidad operativa innecesaria en la etapa MVP).

### 3. Processing Pipeline & OCR Parsing (Google Cloud Vision)

- **Decision**: Google Cloud Vision API (`DOCUMENT_TEXT_DETECTION`) combinado con un conjunto modular de expresiones regulares (Regex Parsers) en TypeScript para Nequi y Bancolombia.
- **Rationale**: Google Cloud Vision ofrece la mayor precisión en lectura de tipografías móviles de Nequi y Bancolombia. El backend procesará el texto consolidado extrayendo patrones conocidos de Monto, Referencia bancaria, Fecha/Hora y Banco emisor.
- **Alternatives Considered**: Tesseract OCR (descartado por baja precisión en capturas de pantalla móviles con baja resolución o compresión de WhatsApp).
- **Implementation Update (Seguridad GCS)**: Para garantizar la lectura exitosa del OCR sobre un bucket privado (evitando el error de rawText vacío), a la API de Cloud Vision no se le pasará la URL pública HTTP (`url_imagen_gcs`). Se le inyectará directamente la URI interna de Google (`gs://[BUCKET]/[FILE]`) o el Buffer de la imagen.

### 4. Integration via WhatsApp Cloud API Webhook

- **Decision**: Endpoint de Webhook dedicado en Express (`/api/v1/webhooks/whatsapp`) con verificación de firma HMAC (`x-hub-signature-256`), validación del número del remitente contra la tabla `Usuarios`, y desacoplamiento en segundo plano.
- **Rationale**: Cumple con los estándares de seguridad de Meta y responde inmediatamente a WhatsApp (`200 OK`) para evitar reintentos duplicados, delegando la descarga de la imagen desde los servidores de Meta y la carga a GCS al pipeline asíncrono.
- **Alternatives Considered**: Procesamiento síncrono en la misma solicitud del webhook (descartado porque WhatsApp invalida la solicitud por timeout si tarda más de 3 segundos).

### 5. Frontend & UI System (Implementation Update)

- **Decision**: Next.js (App Router), React y Tailwind CSS, utilizando `"use client"` únicamente en componentes de alta interactividad (Dropzone, Tablas mutables, Filtros avanzados) para preservar la velocidad de carga del lado del servidor (SSR) en las métricas base.
- **Rationale**: Renderizado inmediato de datos financieros estructurados, arquitectura de componentes altamente reutilizable y diseño con Tailwind enfocado en legibilidad (_scannability_) táctil y visual para cajeros y administradores en pantallas físicas.
- **Alternatives Considered**: React SPA con Vite (descartado a favor de Next.js por su manejo nativo de rutas optimizadas y facilidad para escalar a Server Components en reportes complejos del dashboard).

### 6. File Storage (Google Cloud Storage)

- **Decision**: Google Cloud Storage (GCS) con URLs firmadas temporales (_Signed URLs_) y organización de buckets por `id_comercio`.
- **Rationale**: Acceso seguro a las imágenes de comprobantes sin exponer buckets públicos, garantizando privacidad multi-tenant.
- **Alternatives Considered**: Almacenamiento local en disco (descartado por falta de escalabilidad y no cumplir con la constitución en prevención de pérdida de datos).
