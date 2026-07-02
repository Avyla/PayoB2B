# Quickstart Validation Guide: Payo Módulo 1

Guía rápida para validar de extremo a extremo el flujo de ingesta, OCR y conciliación de comprobantes en el entorno local de desarrollo.

## Prerrequisitos
- Node.js (v18 o superior) y `npm`
- Instancia local o remota de PostgreSQL
- Credenciales de Google Cloud Service Account con permisos en Vision API y Google Cloud Storage

## 1. Configuración de Variables de Entorno
Crear un archivo `.env` en la raíz del backend con las siguientes claves:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:password@localhost:5432/payo_db?schema=public"
JWT_SECRET="super-secret-jwt-key"
GCP_PROJECT_ID="payo-dev"
GCP_STORAGE_BUCKET="payo-receipts-dev"
GOOGLE_APPLICATION_CREDENTIALS="./gcp-key.json"
WHATSAPP_VERIFY_TOKEN="wh_verify_token_payo"
WHATSAPP_APP_SECRET="wh_app_secret_meta"
```

## 2. Inicialización de Base de Datos y Ejecución
```bash
# Ejecutar migraciones de base de datos
npm run db:migrate

# Iniciar servidor backend en modo desarrollo
npm run dev
```

## 3. Escenarios de Validación

### Escenario A: Ingesta Web y Procesamiento OCR (Panel Web / Cajero)
1. **Petición**: Subir una imagen de prueba de un comprobante Nequi al endpoint `POST /api/v1/transactions/upload`.
2. **Resultado Esperado**:
   - HTTP Status `201 Created`.
   - Se crea una fila en la tabla `Transacciones` con los campos extraídos (`banco: 'NEQUI'`, `monto`, `referencia`) y `estado: 'SUBIDO_SIN_VERIFICAR'`.
   - La imagen se almacena en el bucket de GCS.

### Escenario B: Consulta de Métricas y Filtrado en Dashboard (Administrador)
1. **Petición**: Realizar una solicitud `GET /api/v1/dashboard/metrics` y `GET /api/v1/transactions?banco=NEQUI`.
2. **Resultado Esperado**:
   - HTTP Status `200 OK`.
   - Las métricas reflejan el comprobante subido en el Escenario A.
   - La consulta retorna únicamente transacciones asociadas al `id_comercio` autenticado en el token JWT.

### Escenario C: Verificación Manual por el Administrador
1. **Petición**: Enviar `PATCH /api/v1/transactions/:id` con `{"estado": "VERIFICADO_MANUAL"}`.
2. **Resultado Esperado**:
   - HTTP Status `200 OK`.
   - El estado en la base de datos cambia a `VERIFICADO_MANUAL`.
   - El dashboard actualiza el total acumulado del día.

### Escenario D: Ejecución de Pruebas Unitarias del Parser
```bash
npm run test:unit -- tests/unit/parsers.test.ts
```
- **Resultado Esperado**: Todas las pruebas de extracción Regex para comprobantes Nequi y Bancolombia pasan exitosamente (`PASS`).
