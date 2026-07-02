# API Contracts: Express Backend Endpoints

Todos los endpoints requieren autenticación mediante JWT (Bearer Token) que contiene el `id_comercio` y `id_usuario`.

## 1. POST `/api/v1/transactions/upload`
Permite a los cajeros o administradores subir una imagen de comprobante desde el Panel Web.

- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Body**: `file` (File, binary image)
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id_transaccion": "d3b07384-d113-460a-85d8-55f69420b991",
    "banco": "NEQUI",
    "monto": 45000.00,
    "referencia": "M1234567",
    "fecha_transaccion": "2026-06-27T18:30:00.000Z",
    "estado": "SUBIDO_SIN_VERIFICAR",
    "url_imagen_gcs": "https://storage.googleapis.com/payo-receipts/comercio_123/img.jpg",
    "requiere_revision_manual": false
  }
}
```

---

## 2. GET `/api/v1/transactions`
Obtiene la lista paginada y filtrable de transacciones pertenecientes al `id_comercio` autenticado.

- **Query Parameters**:
  - `fecha_inicio` (ISO String, opcional)
  - `fecha_fin` (ISO String, opcional)
  - `banco` (`NEQUI` | `BANCOLOMBIA` | `DESCONOCIDO`, opcional)
  - `estado` (`SUBIDO_SIN_VERIFICAR` | `VERIFICADO_MANUAL` | `RECHAZADO`, opcional)
  - `page` (Integer, default: 1)
  - `limit` (Integer, default: 20)
- **Response `200 OK`**:
```json
{
  "success": true,
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20
  },
  "data": [
    {
      "id_transaccion": "d3b07384-d113-460a-85d8-55f69420b991",
      "banco": "NEQUI",
      "monto": 45000.00,
      "referencia": "M1234567",
      "fecha_transaccion": "2026-06-27T18:30:00.000Z",
      "canal_ingreso": "WEB",
      "estado": "SUBIDO_SIN_VERIFICAR",
      "fecha_creacion": "2026-06-27T18:31:00.000Z"
    }
  ]
}
```

---

## 3. PATCH `/api/v1/transactions/:id`
Permite al Administrador actualizar el estado o corregir manualmente los datos del comprobante.

- **Path Parameter**: `id` (UUID de la transacción)
- **Body**:
```json
{
  "estado": "VERIFICADO_MANUAL",
  "monto": 45000.00,
  "referencia": "M1234567",
  "banco": "NEQUI",
  "notas_revision": "Verificado en extracto bancario Nequi"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id_transaccion": "d3b07384-d113-460a-85d8-55f69420b991",
    "estado": "VERIFICADO_MANUAL",
    "fecha_actualizacion": "2026-06-27T19:00:00.000Z"
  }
}
```

---

## 4. GET `/api/v1/dashboard/metrics`
Obtiene los totales acumulados del día para el comercio autenticado.

- **Query Parameters**: `fecha` (YYYY-MM-DD, opcional, default: fecha actual Colombia)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "fecha": "2026-06-27",
    "monto_total_verificado": 1250000.00,
    "conteo_transacciones": {
      "total": 32,
      "subido_sin_verificar": 5,
      "verificado_manual": 25,
      "rechazado": 2
    },
    "desglose_banco": {
      "nequi": 850000.00,
      "bancolombia": 400000.00
    }
  }
}
```
