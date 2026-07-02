# WhatsApp Ingestion — Guía de uso (Evolution API)

## Servicios involucrados

| Servicio | Puerto | Cómo arrancarlo |
|---|---|---|
| **Redis** | 6379 | `brew services start redis` |
| **Evolution API** | 8080 | Ver paso 2 abajo |
| **Backend Payo** | 3001 | `npm run dev` en `/backend` |

---

## 1. Verificar que Redis está corriendo

```bash
redis-cli ping
# Debe responder: PONG
```

Si no responde:
```bash
brew services start redis
```

---

## 2. Iniciar Evolution API

```bash
cd whatsapp-ingestion/evolution-api
npm run start:prod
```

Verifica que está corriendo:
```bash
curl http://localhost:8080/
# Respuesta: {"status":200,"message":"Welcome to the Evolution API..."}
```

---

## 3. Conectar un número de WhatsApp (una sola vez)

### 3a. Crear la instancia del bot via API

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: payo_evolution_key_local_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "payo-bot",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true,
    "webhook": {
      "enabled": true,
      "url": "http://localhost:3001/api/v1/whatsapp/webhook",
      "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      "byEvents": false
    }
  }'
```

### 3b. Obtener el QR code para escanear

Abre en el navegador el manager de Evolution API:
```
http://localhost:8080/manager
```

Escanea el QR con el número de WhatsApp **dedicado** (no el principal del negocio).

### 3c. Verificar que la conexión está activa

```bash
curl http://localhost:8080/instance/connectionState/payo-bot \
  -H "apikey: payo_evolution_key_local_2024"
# Debe responder: {"instance":{"state":"open"}}
```

---

## 4. Registrar el número del comercio en Payo

El número de WhatsApp del comercio debe estar en la tabla `Usuario` con el campo `telefono_whatsapp`:

```sql
UPDATE "Usuario"
SET telefono_whatsapp = '573001234567'
WHERE email = 'comercio@ejemplo.com';
```

> El formato es solo dígitos, sin `+` ni espacios. Colombia: código `57`.

---

## 5. Flujo cuando un comercio envía una foto

1. El comercio abre WhatsApp y envía una foto al número del bot.
2. Evolution API recibe la imagen y hace un `POST` a `http://localhost:3001/api/v1/whatsapp/webhook`.
3. El backend de Payo:
   - Extrae el número del remitente.
   - Busca el usuario en PostgreSQL.
   - Descarga la imagen de Evolution API.
   - La sube a Google Cloud Storage.
   - Ejecuta OCR con Cloud Vision.
   - Crea la transacción en la base de datos.
4. La transacción aparece en el dashboard de Payo.

---

## 6. Variables de entorno relevantes

### `backend/.env`
```env
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="payo_evolution_key_local_2024"
```

### `whatsapp-ingestion/evolution-api/.env`
```env
WEBHOOK_GLOBAL_URL=http://localhost:3001/api/v1/whatsapp/webhook
WEBHOOK_GLOBAL_ENABLED=true
AUTHENTICATION_API_KEY=payo_evolution_key_local_2024
```
