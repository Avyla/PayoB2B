# Integration Contract: WhatsApp Cloud API Webhook

Punto de enlace expuesto para recibir notificaciones de eventos e imágenes desde Meta WhatsApp Cloud API.

## 1. Verification Endpoint (`GET /api/v1/webhooks/whatsapp`)
Utilizado por Meta para verificar el webhook al configurarlo en el portal de desarrolladores.

- **Query Parameters**:
  - `hub.mode`: Debe ser `"subscribe"`
  - `hub.verify_token`: Token secreto configurado en las variables de entorno (`WHATSAPP_VERIFY_TOKEN`)
  - `hub.challenge`: Cadena aleatoria enviada por Meta
- **Response `200 OK`**: Retorna el texto plano de `hub.challenge`.

---

## 2. Event Notification (`POST /api/v1/webhooks/whatsapp`)
Recibe los mensajes entrantes en tiempo real.

- **Headers**: `x-hub-signature-256` (Firma HMAC SHA256 para validación de origen)
- **Payload Example (Inbound Image Message)**:
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": "whatsapp_business_account",
          "field": "messages",
          "messages": [
            {
              "from": "573001234567",
              "id": "wamid.HBgLNTczMDAxMjM0NTY3FQIAERgSQjE0RTY1M0QzRjQ1OUU2QzA2AA==",
              "timestamp": "1782600000",
              "type": "image",
              "image": {
                "mime_type": "image/jpeg",
                "sha256": "abcdef...",
                "id": "MEDIA_ID_12345"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Internal Processing Workflow upon POST:
1. **Validar Firma**: Verificar `x-hub-signature-256` con `WHATSAPP_APP_SECRET`.
2. **Responder Inmediatamente**: Retornar `200 OK` a Meta en menos de 2 segundos.
3. **Validar Usuario**: Buscar `from` (e.g. `573001234567`) en la tabla `Usuarios`. Si no existe, descartar o notificar usuario no registrado.
4. **Descargar y Guardar**: Consultar la Graph API de Meta con `MEDIA_ID_12345` para obtener la URL de descarga, descargar la imagen binaria y subirla a Google Cloud Storage en `gs://payo-receipts/{id_comercio}/{uuid}.jpg`.
5. **OCR & Parsing**: Invocar Google Cloud Vision API y los parsers de Nequi/Bancolombia.
6. **Persistir**: Crear registro en la tabla `Transacciones` con `canal_ingreso = 'WHATSAPP'`.
