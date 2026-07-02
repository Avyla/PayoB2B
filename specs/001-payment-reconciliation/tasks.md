---
description: "Listado de tareas secuenciales para la implementación del Módulo 1 de Payo"
---

# Tasks: Automatización de Conciliación de Comprobantes (Payo - Módulo 1)

**Input**: Diseños y especificaciones de `/specs/001-payment-reconciliation/`

**Prerequisites**: plan.md (requerido), spec.md (requerido), data-model.md, contracts/, research.md, quickstart.md

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Ejecutable en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia de usuario correspondiente ([US1], [US2], [US3])
- Rutas exactas en cada descripción

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto y estructura base desacoplada (Frontend/Backend)

- [x] T001 Crear la estructura de directorios del proyecto backend y frontend según el plan de implementación en backend/ y frontend/
- [x] T002 Inicializar el proyecto Node.js TypeScript en backend/ con Express, Prisma/Pg, y SDKs de Google Cloud en backend/package.json
- [x] T003 [P] Inicializar el proyecto Next.js con React, App Router y Tailwind CSS en frontend/package.json
- [x] T004 [P] Configurar el cargador de variables de entorno y validación de esquema en backend/src/config/env.ts y frontend/.env.local

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura central y esquema de base de datos que bloquea las historias de usuario

**⚠️ CRITICAL**: Ninguna historia de usuario puede comenzar hasta completar esta fase

- [x] T005 Crear esquema de base de datos PostgreSQL y migraciones para Comercios, Usuarios y Transacciones en backend/prisma/schema.prisma
- [x] T006 [P] Implementar utilidades de autenticación JWT y hashing de contraseñas con bcrypt en backend/src/utils/auth.ts
- [x] T007 [P] Implementar middleware de aislamiento multi-tenant que valide e inyecte id_comercio en backend/src/middlewares/tenant.middleware.ts
- [x] T008 Configurar pool de conexiones a PostgreSQL y repositorios base en backend/src/models/db.ts
- [x] T009 Configurar cliente de Google Cloud Storage (GCS) y servicio de subida de imágenes en backend/src/services/gcs.service.ts

**Checkpoint**: Infraestructura base lista. La implementación de historias de usuario puede comenzar.

---

## Phase 3: User Story 1 - Ingesta Multicanal y Extracción Automática (Priority: P1) 🎯 MVP

**Goal**: Permitir la carga de comprobantes (Web/WhatsApp), procesamiento OCR (Google Cloud Vision) con Parsers Regex (Nequi/Bancolombia) y registro en estado "Subido sin verificar".

**Independent Test**: Subir imagen de comprobante vía API/Web o webhook WhatsApp y verificar creación de transacción en base de datos con datos extraídos.

- [x] T010 [P] [US1] Escribir pruebas unitarias automatizadas para los parsers Regex de Nequi y Bancolombia en backend/tests/unit/parsers.test.ts
- [x] T011 [P] [US1] Implementar parser Regex de comprobantes Nequi en backend/src/parsers/nequi.parser.ts
- [x] T012 [P] [US1] Implementar parser Regex de comprobantes Bancolombia en backend/src/parsers/bancolombia.parser.ts
- [x] T013 [US1] Implementar despachador de parsers y lógica de fallback grácil en backend/src/parsers/index.ts
- [x] T014 [US1] Implementar servicio de integración con Google Cloud Vision API en backend/src/services/ocr.service.ts
- [x] T015 [US1] Implementar servicio de orquestación de transacciones y pipeline OCR en backend/src/services/transaction.service.ts
- [x] T016 [US1] Crear endpoint REST para carga web de comprobantes POST /api/v1/transactions/upload en backend/src/controllers/upload.controller.ts
- [x] T017 [US1] Configurar y exponer Webhook de WhatsApp Cloud API (GET/POST) en backend/src/controllers/whatsapp.controller.ts
- [x] T018 [P] [US1] Construir componente modal de carga manual de comprobantes con Tailwind CSS en frontend/src/components/UploadModal.tsx

**Checkpoint**: User Story 1 totalmente funcional y testeable de manera independiente (MVP).

---

## Phase 4: User Story 2 - Dashboard B2B y Gestión de Estados por Administrador (Priority: P2)

**Goal**: Visualizar métricas diarias consolidadas y tabla de transacciones con opción de verificación manual o rechazo.

**Independent Test**: Consultar métricas en el Dashboard y cambiar el estado de un comprobante, confirmando la actualización del consolidado.

- [x] T019 [US2] Implementar endpoint de métricas consolidadas del día GET /api/v1/dashboard/metrics en backend/src/controllers/dashboard.controller.ts
- [x] T020 [US2] Implementar endpoint de listado y filtrado de transacciones GET /api/v1/transactions en backend/src/controllers/transaction.controller.ts
- [x] T021 [US2] Implementar endpoint de actualización de estado y edición manual PATCH /api/v1/transactions/:id en backend/src/controllers/transaction.controller.ts
- [x] T022 [P] [US2] Crear tarjetas de métricas del Dashboard con Tailwind CSS en frontend/src/components/DashboardMetrics.tsx
- [x] T023 [P] [US2] Crear tabla de transacciones recientes con botones de acción en frontend/src/components/TransactionsTable.tsx
- [x] T024 [US2] Conectar la página principal del Dashboard con la API backend en frontend/src/app/dashboard/page.tsx

**Checkpoint**: User Stories 1 y 2 integradas y funcionando independientemente.

---

## Phase 5: User Story 3 - Filtros Avanzados y Auditoría Multi-inquilino (Priority: P3)

**Goal**: Proveer filtros avanzados por rango de fecha, banco y estado con garantía de aislamiento estricto por id_comercio.

**Independent Test**: Filtrar el historial por múltiples criterios y validar que nunca se retornen datos de otros comercios.

- [x] T025 [P] [US3] Crear componente de filtros avanzados (fecha, banco, estado) en frontend/src/components/AdvancedFilters.tsx
- [x] T026 [US3] Implementar registro de auditoría para cambios de estado en backend/src/services/audit.service.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes finales, vistas de acceso y validación rápida

- [x] T027 [P] Implementar pantallas de inicio de sesión y registro en frontend/src/app/login/page.tsx
- [x] T028 Ejecutar escenarios de validaciones rápidas end-to-end según specs/001-payment-reconciliation/quickstart.md
- [x] T029 Limpieza de código, verificación de compilación estricta TypeScript (tsc --noEmit) y endurecimiento de seguridad

---

## Phase 7: Remediaciones de Auditoría (High Priority) 🛡️

**Purpose**: Resolver las vulnerabilidades y carencias de funcionalidad (Issues HIGH) detectadas en la auditoría de Spec Kit.

- [x] T030 [US1] Implementar validación de MIME type para permitir solo extensiones seguras (JPG, PNG, WEBP) (Solución U2) en backend/src/controllers/upload.controller.ts
- [x] T031 [US1] Implementar validación de prevención de duplicados cruzando referencia, banco e id_comercio (Solución U1) en backend/src/services/transaction.service.ts
- [x] T032 [US1] Reemplazar el mock temporal (`mockImageBuffer`) por la integración real de descarga multimedia usando la Meta Graph API (Solución C2) en backend/src/controllers/whatsapp.controller.ts

---

## Phase 8: Refinamiento de OCR y Estandarización de Ingesta (Post-Pruebas) 🛠️

**Purpose**: Solucionar la limitación de lectura del OCR por privacidad del bucket, ajustar las expresiones regulares y estandarizar la entrada del middleware de imágenes.

- [x] T033 [US1] Modificar `upload.controller.ts` para que Multer procese estrictamente la llave `image` (en lugar de `file`) solucionando el error `Unexpected field`.
- [x] T034 [US1] Modificar `ocr.service.ts` para que pase a Google Cloud Vision la URI nativa `gs://[BUCKET]/[FILE]` o el Buffer, garantizando la extracción de texto en buckets privados.
- [x] T035 [US1] Refinar las Regex en `nequi.parser.ts` y `bancolombia.parser.ts` para capturar correctamente el banco, monto, referencia y fecha_transaccion a partir del nuevo `rawText` que entregará el OCR arreglado.
- [x] T036 [US2] Ampliar la lógica del endpoint `PATCH /api/v1/transactions/:id` en `transaction.controller.ts` para permitir la actualización de campos nulos (`banco`, `monto`, `referencia`, `fecha_transaccion`) cuando el OCR devuelva datos irreconocibles.

---

## Phase 9: Frontend Implementation & Integration 🖥️

**Purpose**: Construir la interfaz visual de la aplicación, conectar los componentes con la API REST del backend y permitir la interacción completa del usuario (Carga y Dashboard).

- [x] T037 [US1] Crear el componente de navegación global `SidebarLayout.tsx` e integrarlo en el `layout.tsx` principal de Next.js para estructurar la aplicación.
- [x] T038 [US1] Desarrollar el componente interactivo `UploadDropzone.tsx` en el frontend que permita arrastrar imágenes, validarlas localmente (solo JPG/PNG) y enviarlas a `POST /api/v1/transactions/upload`, mostrando el estado de carga y notificaciones de éxito/error.
- [x] T039 [US2] Refactorizar la tabla `TransactionsTable.tsx` para incluir un modo de "Edición Manual" (Modal o Inline), permitiendo al administrador corregir campos vacíos y enviarlos mediante `PATCH /api/v1/transactions/:id`.
- [x] T040 [US2] Implementar la lógica de consumo (Fetch/SWR) en `dashboard/page.tsx` para que la vista recargue automáticamente las métricas y la tabla cuando el componente `UploadDropzone` suba un nuevo comprobante con éxito.
- [x] T041 [US3] Conectar el componente `AdvancedFilters.tsx` con el estado de la página del Dashboard, asegurando que al cambiar fechas, bancos o estados, la tabla ejecute un nuevo fetch a la API con los Query Params correspondientes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias - Inicia inmediatamente.
- **Foundational (Phase 2)**: Depende de Setup - Bloquea todas las historias de usuario.
- **User Story 1 (Phase 3)**: Depende de Foundational - Entrega el MVP.
- **User Story 2 (Phase 4)**: Depende de Foundational y consume datos generados por US1.
- **User Story 3 (Phase 5)**: Depende de US2 para aplicar filtros sobre el Dashboard.
- **Polish (Phase 6)**: Depende de la finalización de las historias de usuario.
- **Remediaciones (Phase 7)**: Ejecutar correcciones críticas detectadas post-MVP.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1 (Setup) y Fase 2 (Foundational).
2. Completar Fase 3 (User Story 1: Ingesta Web/WhatsApp + OCR + Parsers).
3. **Validar MVP**: Probar carga de imágenes y extracción de datos en base de datos.
4. **Remediar Auditoría**: Ejecutar Fase 7 para cerrar brechas de seguridad y funcionalidad.

---

## Phase 10: Convergence

**Purpose**: Completar requerimientos faltantes detectados durante la evaluación de convergencia.

- [x] T042 CRITICAL: Implementar endpoint `POST /api/v1/auth/login` en el backend para emitir tokens JWT válidos y conectar el frontend `login/page.tsx` para solucionar los errores 401 Unauthorized per FR-005 (missing)
- [x] T043 HIGH: Implementar middleware de rate limiting estricto por IP en el endpoint `POST /api/v1/transactions/upload` per FR-010 (missing)
- [x] T044 MEDIUM: Desarrollar controles UI de paginación (Página Siguiente/Anterior) en el Dashboard y enviarlos como `offset/limit` al backend per FR-009 (partial)

---

## Phase 11: Frontend Polish & UX/UI Remediation 🎨

**Purpose**: Resolver los hallazgos críticos de la auditoría frontend, mejorando la accesibilidad visual, la experiencia de carga en móviles y asegurando consistencia de idioma.

- [x] T045 [UI] Refactorizar la paleta de colores y estilos en `DashboardMetrics.tsx` y `TransactionsTable.tsx` para aplicar un diseño financiero corporativo, garantizar alto contraste en los badges de estado/banco y corregir el formato monetario a COP.
- [x] T046 [UI] Actualizar `UploadDropzone.tsx` añadiendo el atributo `capture="environment"` en el input, un botón de captura de cámara explícito y renderizar una vista previa (`img src`) de la imagen antes de subirla.
- [x] T047 [UI] Traducir todas las etiquetas (labels), opciones de los selects y botones en el componente `AdvancedFilters.tsx` de inglés a español.

---

## Phase 12: Alineación Contable y Unificación de Pantalla Única 🖥️

**Purpose**: Solucionar bugs técnicos de Prisma, priorizar métricas de negocio, indexar la categoría 'Otros Bancos' y unificar la aplicación en una sola ventana interactiva con fechas reactivas.

- [x] T048 Corregir en el backend (`backend/src/controllers/transaction.controller.ts`) la invocación de `prisma.transaccion.update`, cambiando el argumento inválido `numero_referencia` por la columna correcta de la base de datos `referencia` en backend/src/controllers/transaction.controller.ts
- [x] T049 Refactorizar la ventana/modal de detalles y verificación de transacciones para que adopte estrictamente el mismo sistema de diseño, paleta de colores corporativa y tipografías que el Dashboard principal en frontend/src/components/TransactionsTable.tsx
- [x] T050 Modificar `DashboardMetrics.tsx` para posicionar el "Monto Total Reportado" como la métrica contable jerárquica principal, relegando los montos por estado a bloques secundarios en frontend/src/components/DashboardMetrics.tsx
- [x] T051 Actualizar los parsers de OCR y el esquema/controladores para clasificar transacciones de bancos no reconocidos o alternativos bajo la etiqueta estandarizada `"OTROS_BANCOS"` en backend/prisma/schema.prisma
- [x] T052 Modificar los endpoints de analíticas y listados en el backend para aceptar y procesar parámetros de consulta opcionales (`startDate` y `endDate`), aplicando el filtro por rango de fechas en las consultas de Prisma en backend/src/controllers/transaction.controller.ts
- [x] T053 Vincular los estados de fecha de `AdvancedFilters.tsx` con las peticiones a la API para refrescar de forma reactiva las métricas y las tablas en pantalla ante cualquier cambio de rango en frontend/src/components/AdvancedFilters.tsx
- [x] T054 Fusionar la vista de carga (`UploadDropzone.tsx`) dentro de la página principal del Dashboard (`frontend/src/app/page.tsx` o equivalente) y remover los enlaces y rutas de navegación obsoletas del Navbar en frontend/src/app/dashboard/page.tsx

---

## Phase 13: Seguridad de Acceso y Aprovisionamiento Multi-tenant 🔒

**Purpose**: Resolver la vulnerabilidad de acceso sin autenticación en el frontend y habilitar el mecanismo de onboarding programático para comercios B2B.

- [x] T055 Implementar un Auth Guard (Middleware/HOC) genérico para todas las rutas del dashboard en el frontend, y asegurar los endpoints de la API en el backend para prevenir accesos no autenticados en frontend/src/middleware.ts`) o un Auth Guard global a nivel de Layout para interceptar todas las rutas privadas y forzar la redirección automática a `/login` si el token JWT no existe o expiró en frontend/src/middleware.ts
- [x] T056 Crear un script automatizado de Node.js utilizando TypeScript y Prisma Client (`backend/scripts/create-comercio.ts`) para registrar nuevos comercios y su usuario administrador inicial de manera segura directamente desde la terminal en backend/scripts/create-comercio.ts

---

## Phase 14: Refinamiento de Métricas, UX Móvil y Cuarentena de Duplicados 🚀

**Purpose**: Corregir el bug del input file en móviles, ajustar la lógica matemática/visual del Dashboard y construir el flujo avanzado de resolución de duplicados.

- [x] T057 [Database] Modificar `schema.prisma` para agregar `DUPLICADO_SOSPECHOSO` al Enum `EstadoTransaccion` y el campo `duplicado_de_id` (String UUID opcional) a la tabla `Transaccion`. Generar y aplicar la migración en la base de datos en backend/prisma/schema.prisma
- [x] T058 [BugFix] En `UploadDropzone.tsx`, corregir la propagación de eventos (`e.stopPropagation()`) que causa que el selector de archivos se abra dos veces, asegurando el uso de `accept="image/*"` y `capture="environment"` en frontend/src/components/UploadDropzone.tsx
- [x] T059 [Backend] Modificar `dashboard.controller.ts` para que el `totalAmount` sume absolutamente todas las transacciones del rango de fechas, ignorando por completo su estado en backend/src/controllers/dashboard.controller.ts
- [x] T060 [UI] Refactorizar `DashboardMetrics.tsx` para aplicar una jerarquía visual extrema al "Monto Total", minimizando visualmente las tarjetas secundarias ("Verificados", "Por Verificar", "Rechazados") en frontend/src/components/DashboardMetrics.tsx
- [x] T061 [Backend] Modificar `transaction.service.ts` para que, ante un duplicado, no devuelva error HTTP 409, sino que cree la transacción con estado `DUPLICADO_SOSPECHOSO` y la enlace al original (`duplicado_de_id`). Modificar la consulta GET en `transaction.controller.ts` para incluir los datos de la original en el JSON de respuesta en backend/src/services/transaction.service.ts
- [x] T062 [Frontend] Crear un componente `DuplicatesResolution.tsx` (o integrarlo en la tabla) para listar las transacciones sospechosas. Mostrar una vista comparativa (foto vs foto) con opciones de "Descartar Duplicado (Rechazar)" o "Forzar Aprobación (Verificado)" en frontend/src/components/DuplicatesResolution.tsx

### Phase 15: Ajuste de Montos, Fix de Zonas Horarias y Refactor de UploadDropzone

- [x] T063 [Backend/Frontend] Fix Bug de Zona Horaria (Fecha): Modificar los parsers (Nequi/Bancolombia) para que registren la fecha asumiendo la zona horaria de Colombia (UTC-5) al guardarla en la base de datos, y modificar la tabla de transacciones en frontend para que convierta el timestamp UTC devuelto por el servidor de vuelta a la hora local para el input `datetime-local`.
- [x] T064 [Backend] Modificar `dashboard.controller.ts` para que el `totalAmount` sume únicamente los montos de transacciones en estado `VERIFICADO_MANUAL` o `SUBIDO_SIN_VERIFICAR`, ignorando `RECHAZADO` y `DUPLICADO_SOSPECHOSO`.
- [x] T065 [Frontend] Refactorizar la UI de `UploadDropzone.tsx` para separar visual y funcionalmente el botón de Galería del botón de Tomar Foto, eliminando el trigger global `onClick` para prevenir cruces de eventos en móviles.

### Phase 16: Remediación de Análisis (Edge Cases y Benchmarks)

- [x] T066 [Backend] Implementar lógica de "Extracción no disponible": Modificar `upload.controller.ts` o `transaction.service.ts` para que, cuando el OCR falle extrayendo datos esenciales (ej. monto es null o banco es OTROS_BANCOS), el sistema asigne automáticamente `"Extracción no disponible"` al campo `notas_revision` de la transacción.
- [x] T067 [Backend/DevOps] Infraestructura de Pruebas y Benchmarks: Crear scripts automatizados en el backend (ej. `backend/scripts/benchmark-ocr.ts` y `benchmark-load.ts`) para perfilar el cumplimiento de `SC-001` (procesamiento web < 4s, webhook < 2s) y `SC-002` (precisión > 92% en OCR).

---

## Phase 17: Motor de Cruce Automático Email-Comprobante (Matching) 🤝✉️

**Purpose**: Implementar el servicio de conciliación automática que vincula los comprobantes físicos (OCR) con los correos electrónicos bancarios entrantes (Gmail) asegurando coincidencia exacta de datos, y manejando casos límite como correos huérfanos y cruce manual.

- [x] T068 [Backend/DB] Modificar `backend/prisma/schema.prisma`: Añadir el valor `VERIFICADO_SISTEMA` al enum `EstadoTransaccion` y agregar la relación opcional `id_alerta_email` (vinculada a `AlertaEmail`) en el modelo `Transaccion`. Ejecutar `npx prisma db push` o generar la migración.
- [x] T069 [Backend] Crear el archivo `backend/src/services/match.service.ts` que contenga las funciones `matchTransaction(id)` y `matchEmailAlert(id)`. La lógica debe validar estrictamente coincidencia de id_comercio, banco, referencia y monto. Debe ignorar transacciones DUPLICADO_SOSPECHOSO y correos ya conciliados.
- [x] T070 [Backend] Modificar `backend/src/services/transaction.service.ts` para que, inmediatamente después de crear la transacción exitosamente (tras el OCR), llame de forma asíncrona a `matchTransaction(nuevaTransaccion.id)`.
- [x] T071 [Backend] Modificar `backend/src/modules/email-integration/gmail.service.ts` (o donde se procesen los webhooks de Gmail) para que, al guardar un correo bancario exitosamente, llame a `matchEmailAlert(nuevaAlerta.id)`.
- [x] T072 [Frontend/Backend] Implementar endpoints de listado (`GET /api/v1/email/pendientes`) y UI para el "Buzón Bancario" (Correos Huérfanos). Modificar `dashboard/page.tsx` para incluir pestañas que separen los Comprobantes Subidos de las Alertas Pendientes.
- [x] T073 [Frontend/Backend] Implementar Cruce Manual: Endpoint `POST /api/v1/transactions/:id/link-email` y UI en la tabla de transacciones para abrir un Modal que sugiera correos pendientes, permitiendo al administrador forzar la conciliación marcándola como `VERIFICADO_MANUAL`.
- [x] T074 [Frontend] Actualizar visualmente la tabla de transacciones para soportar el estado `VERIFICADO_SISTEMA` (ej. color verde distintivo con icono) diferenciándolo de la verificación manual.

---

## Phase 18: Rediseño UX/UI Frontend (Spec-Kit) 🎨

**Purpose**: Ejecutar el rediseño radical de la interfaz de usuario basado en principios financieros (trust, minimalismo), reorganizando el dashboard y mejorando la accesibilidad y feedback visual.

- [x] T075 [UI] Reestructurar `page.tsx` y `SidebarLayout.tsx` para mover tarjetas de integración (Email, WhatsApp) al Sidebar o a modales, enfocando la vista en Carga, Métricas y Tabla.
- [x] T076 [UI] Implementar Feedback Visual (Toasts y Skeletons) en `page.tsx`, `UploadDropzone.tsx` y `DashboardMetrics.tsx` para notificar acciones y estados de carga.
- [x] T077 [UI] Actualizar el sistema de diseño: tipografía estricta, contraste WCAG y distintivos visuales por estado (⚡ para `VERIFICADO_SISTEMA`, ⚠️ para `DUPLICADO_SOSPECHOSO`, 👤 para `VERIFICADO_MANUAL`).
- [x] T078 [UI] Desarrollar la vista dual (Foto vs Foto lado a lado) en el modal de transacciones para resolver casos de `DUPLICADO_SOSPECHOSO`.
- [x] T079 [UI] Mejorar `AdvancedFilters.tsx` (traducción al español y barra de herramientas compacta) y perfeccionar `UploadDropzone.tsx` (preview de foto e input `capture="environment"`).

---

## Phase 19: Implementación Final de Interfaz de Correos (Buzón y Cruce) ✉️

**Purpose**: Resolver falencias bloqueantes de QA proveyendo los endpoints e interfaz para el Buzón Bancario (Correos Pendientes) y el Cruce Manual de comprobantes no detectados.

- [x] T080 [Backend] Implementar `email.controller.ts` para exponer GET de correos pendientes y POST para forzar cruce manual invocando `MatchService`.
- [x] [Backend] Configurar `email.routes.ts` y anexar la ruta a los enrutadores globales.
- [x] T081 [Frontend] Actualizar `EmailSyncModal.tsx` con llamadas SWR para renderizar la tabla/lista de correos bancarios pendientes.
- [x] T082 [Frontend] Actualizar el modal de edición en `TransactionsTable.tsx` para transacciones `SUBIDO_SIN_VERIFICAR`, desplegando el selector de correos pendientes y conectando con el endpoint de enlace.

---

## Phase 20: Rediseño Ejecutivo, Minimalista y Mobile-First 📱🏦

**Purpose**: Alinear el aplicativo con una estética bancaria estricta (Navy/Slate/White), erradicar colores pastel, implementar un layout puramente responsive para móviles y rediseñar el widget de "Monto Total" hacia el minimalismo.

- [x] T085 [UI] Refactorizar la estructura de navegación en `SidebarLayout.tsx` (o equivalente) para implementar una Bottom Tab Bar (navegación inferior) en dispositivos móviles y ocultar el sidebar tradicional.
- [x] T086 [UI] Actualizar `tailwind.config.ts` o variables CSS para definir la nueva paleta "Executive" (Navy oscuro, Slate profundo, Pure White, erradicando colores pastel de las alertas).
- [x] T087 [UI] Rediseñar los componentes de Badges en `TransactionsTable.tsx` para usar bordes sólidos minimalistas y texto corporativo en lugar de fondos pastel llamativos.
- [x] T088 [UI] Refactorizar `DashboardMetrics.tsx` para presentar el "Monto Total" con máxima sobriedad y minimalismo (tipografía seria tipo banco, sin saturación visual).
- [x] T089 [UI] Reorganizar la disposición de los filtros (`AdvancedFilters.tsx`) y los modales para que se rendericen como hojas inferiores (Bottom Sheets) o modales a pantalla completa en móviles para facilitar el toque (Touch Targets).
- [x] T090 [UI] Refactorizar la Zona de Cuarentena (resolución de duplicados) en `TransactionsTable.tsx` para usar un diseño apilado (vertical) en móviles en lugar de lado a lado.
- [x] T091 [UI] Implementar Skeleton Loaders minimalistas para estados de carga y Toasts oscuros (discretos) en la parte inferior para notificar acciones en segundo plano (como sincronización de correos).

---

## Phase 21: AI Email Parser & Bre-B Support 🤖

**Purpose**: Implementar la estrategia híbrida (Regex + Gemini Fallback) de parseo de correos, soportar transferencias Bre-B sin referencia y añadir la interfaz DLQ.

- [x] T092 [Database] Modificar `schema.prisma`: Añadir enum `EstadoAlertaEmail`, `nombre_remitente_ocr` en `Transaccion`, y campos de error (`html_original`, `fecha_hora_transaccion`, `nombre_remitente`) en `AlertaEmail`.
- [x] T093 [Backend] Crear `backend/src/services/email-parser.service.ts` con la lógica híbrida: Fase A (Regex) y Fase B (Google Gemini 1.5 JSON Mode Fallback) que extraiga estrictamente de la hora interna del correo.
- [x] T094 [Backend] Actualizar `match.service.ts` para ejecutar cruces estrictos (=) truncados a nivel minuto, ya sea por referencia o por `nombre_remitente_ocr` (para Bre-B).
- [x] T095 [Frontend] Modificar `EmailIntegrationModal.tsx` añadiendo la sub-pestaña "Correos No Reconocidos (DLQ)" con botón de "Re-procesar", Skeleton Loaders y Toasts informativos.

---

## Phase 22: Refinamiento de Dashboard y Componentes de Carga 🚀

**Purpose**: Optimizar el espacio visual del Dashboard quitando protagonismo al área de carga de recibos, actualizar los indicadores de estado y habilitar contadores para bancos alternos.

- [x] T096 [Backend/Frontend] Actualizar el endpoint de métricas `dashboard.controller.ts` para extraer y sumar `countOtrosBancos`. Actualizar la interfaz `MetricsData` en el frontend.
- [x] T097 [UI] Refactorizar los Badges de Estado en `TransactionsTable.tsx` para eliminar iconos y utilizar colores intuitivos sólidos (emerald, teal, rose, amber, slate).
- [x] T098 [UI] Implementar `UploadModal.tsx` como ventana flotante y refactorizar `dashboard/page.tsx` para disparar el modal de carga desde un botón en la cabecera, limpiando el layout principal del Dashboard.

---

## Phase 23: Performance Optimization & Code Cleanup 🚀

**Purpose**: Ejecutar el plan de limpieza de código muerto y optimizar el rendimiento (Lazy Loading de Signed URLs) de GCS.

- [x] T099 [Backend] Modificar `transaction.controller.ts` para no generar `Signed URLs` en el endpoint `getTransactions`. Crear un nuevo endpoint `GET /transactions/:id/image` que redirija a la Signed URL.
- [x] T100 [Backend] Limpiar dependencias (`zod`, `tsx`, `@types/express-rate-limit`) que no se utilicen (verificando que no rompan nada). Eliminar archivos basura de backend (`debug.js`, `quick-seed.js`, `time-req.js`, `seed_whatsapp.ts`, `diag.ts`, `audit.service.ts`) manteniendo `scripts/`.
- [x] T101 [Frontend] Eliminar componentes muertos (`EmailSyncCard.tsx` y otros detectados en frontend) y cambiar la tabla `TransactionsTable.tsx` para que consuma el nuevo endpoint dinámico de imágenes al abrir el modal en vez de usar la Signed URL en caliente.

---

## Phase 24: Reports & Audit Trails Implementation 📊

**Purpose**: Implementar la visualización y persistencia de reportes financieros, de fraude y auditoría inmutable, sin comprometer el rendimiento, siguiendo la arquitectura de panel móvil con Lazy Loading y agregación en BD.

- [x] T102 [Database] Modificar `schema.prisma` para crear el nuevo modelo `LogAuditoria` con los campos necesarios para trazabilidad inmutable e indexar por `id_comercio` y `created_at`.
- [x] T103 [Backend] Crear `backend/src/controllers/report.controller.ts` con 3 endpoints analíticos utilizando agregaciones nativas de Prisma: `GET /cierre`, `GET /anomalias`, y `GET /eficiencia`.
- [x] T104 [Backend] Refactorizar `backend/src/services/transaction.service.ts` para inyectar inserciones asíncronas a `LogAuditoria` en todas las mutaciones críticas de estado (verificación manual, rechazos, aprobaciones forzadas, subidas).
- [x] T105 [Frontend] Desarrollar la interfaz móvil ejecutiva en `frontend/src/app/dashboard/reports/page.tsx` conectada al Bottom Tab Bar, incluyendo selectores nativos de rango de fecha y hora exactos.
- [x] T106 [Frontend] Construir la vista de Auditoría de Comprobantes implementando Lazy Loading de imágenes (Bottom Sheet con endpoint dinámico, reemplazando la carga directa de GCS).
- [x] T107 [Frontend] Añadir la exportación de datos en CSV para los Cierres de Caja mediante un botón minimalista.

---

## Phase 25: WhatsApp Security & RBAC 🛡️

**Purpose**: Asegurar el módulo de WhatsApp vinculando restricciones de cuota, controles de acceso estrictos, trazabilidad inmutable y prevención de eliminación accidental en la UI.

- [x] T108 [Backend] Implementar límite máximo de 5 números por comercio en `POST /api/v1/whatsapp-links`.
- [x] T109 [Backend] Aplicar validación de rol (`ADMINISTRADOR`) en los endpoints `POST` y `DELETE` de `whatsapp-links.controller.ts` para restringir el acceso.
- [x] T110 [Backend] Registrar eventos de vinculación y desvinculación de números en la tabla centralizada `LogAuditoria`.
- [x] T111 [Frontend] Modificar `WhatsAppManagerModal.tsx` o su equivalente para incluir la confirmación de eliminación exigiendo la palabra "ELIMINAR" dentro de un componente Bottom Sheet optimizado para móviles.

---

## Phase 26: Adaptive Regex Engine Refactor 🧠

**Purpose**: Implementar el motor adaptativo de expresiones regulares propuesto en el PlanRegex20, incluyendo la sanitización HTML, la cola de prioridad de reglas (Priority Queue) y el parseo estricto de fechas, garantizando resiliencia frente a variaciones de formato sin depender inmediatamente de Gemini.

- [x] T112 [Backend] Implementar módulo de sanitización (`html-stripper`) en el parser que convierta el HTML crudo en texto plano limpio (removiendo tags, `<br>` y `&nbsp;`).
- [x] T113 [Backend] Refactorizar `email.parser.ts` para sustituir el bloque if/else por un `Priority Queue` o Array auto-ordenable de reglas heurísticas (Extractor Nodes).
- [x] T114 [Backend] Implementar parseo estricto de fechas (DD/MM) en `email.parser.ts` utilizando métodos nativos precisos o librerías externas para generar correctamente el formato ISO.
- [x] T115 [Backend] Crear y ejecutar un script de pruebas local (`backend/scripts/test-failed-emails.ts`) que lea los correos en `email_test/FallosReportados.md` y valide que el 100% sea procesado exitosamente por el nuevo motor.

---

## Phase 27: Webhook Security & Caching 🛡️

**Purpose**: Optimizar y formalizar el Firewall de Confianza Cero (Zero Trust) en el webhook de WhatsApp para abortar peticiones de spam en <1ms mediante Caché en Memoria, protegiendo a la base de datos de saturaciones y ahorrando costos de Cloud Vision.

- [x] T116 [Backend] Crear `whatsapp-firewall.service.ts` que exponga métodos para inicializar, agregar, remover y verificar números autorizados usando un `Set` nativo en memoria.
- [x] T117 [Backend] Inyectar la inicialización del caché en el arranque de la app, y su sincronización dinámica (`addNumber`/`removeNumber`) en `whatsapp-links.controller.ts`.
- [x] T118 [Backend] Refactorizar `whatsapp.controller.ts` para reemplazar la validación en PostgreSQL por una validación en caché (`WhatsAppFirewall.isAuthorized`) y agregar contadores métricos sin saturar la DB de auditoría.

## Fase 28: Real-Time Gmail Pub/Sub Integration
- [ ] T119: Actualizar esquema Prisma (Campos `gmail_history_id`, `gmail_watch_expires_at` en `ConexionGmail`).
- [ ] T120: Crear controlador del webhook público (`POST /api/v1/webhooks/gmail`).
- [ ] T121: Crear servicio `gmail-pubsub.service.ts` para activar y renovar el Watch.
- [ ] T122: Optimizar `gmail.service.ts` para leer usando `history_id`.
- [ ] T123: Generar instrucciones paso a paso para GCP Console.

## Fase 29: UX Redesign - Email Sync Drawer
- [x] T124 [Frontend] Eliminar `EmailSyncModal.tsx` y crear `EmailSyncDrawer.tsx` (Side Drawer ancho) para mostrar la interfaz de sincronización sin bloquear visualmente el dashboard principal.
- [x] T125 [Backend] Aktualizar el controlador/servicio de DLQ (`email.controller.ts`) para parsear y devolver metadatos adicionales (asunto, remitente_limpio) desde el correo original para enriquecer la UI.
- [x] T125 [Backend] Actualizar el controlador/servicio de DLQ (`email.controller.ts`) para parsear y devolver metadatos adicionales (asunto, remitente_limpio) desde el correo original para enriquecer la UI.
- [x] T126 [Frontend] Implementar la función "Vincular Manualmente" para los correos del Buzón de Huérfanos, permitiendo conectarlos con transacciones existentes.
- [x] T127 [Frontend] Implementar renderizado seguro con `iframe` (aislado) en la Cola de Errores (DLQ) para mostrar el contenido visual del correo en vez de código HTML crudo.

---

## Phase 35: Email Drawer UI/UX Refinement 📱🎨

**Purpose**: Refactorizar la estructura Flexbox en `EmailSyncDrawer.tsx` solucionando los colapsos de texto y aplicando estándares de accesibilidad estricta.

- [x] T128 [UI/UX] Añadir propiedades de truncamiento accesibles (`min-w-0`, `truncate` y HTML `title`) en los campos de Asunto y Remitente.
- [x] T129 [UI/UX] Forzar una arquitectura Mobile-First estricta en los botones de acción (`flex-col` en móviles y `sm:flex-row` en PC), agregando `shrink-0` y `whitespace-nowrap` para evitar rupturas de texto.

## Fase 30: Frontend Optimization & Enriched Transaction Details 🚀
- [x] T128 [Frontend] Modificar `frontend/src/app/dashboard/page.tsx` para inicializar `startDate` y `endDate` con la fecha actual, y pasar estos valores iniciales a `AdvancedFilters.tsx`. Asegurar que las tarjetas de métricas reaccionen a este estado inicial de fechas.
- [x] T129 [Frontend] Modificar `frontend/src/components/AdvancedFilters.tsx` para aceptar `initialFilters` y usarlos en su estado local. Ajustar la función de "Limpiar" para vaciar los campos y permitir visualizar todo el historial.
- [x] T130 [Frontend] Modificar `frontend/src/components/TransactionsTable.tsx`: Actualizar la interfaz `Transaction` para incluir `creador`, `canal_ingreso`, y `nombre_remitente_ocr`. Diseñar y renderizar una nueva sección en el modal de detalles para mostrar esta información de auditoría con estilo acorde al diseño base.

## Fase 31: WhatsApp UI/UX Refinement 💬
- [x] T131 [Frontend] Renombrar o refactorizar `WhatsAppManagerModal.tsx` a `WhatsAppManagerDrawer.tsx` (Panel Lateral o Bottom Sheet) para alinearse con la UI de correos.
- [x] T132 [Frontend] Implementar máscara de entrada (Input Masking) para el formato del celular e incluir spinners de carga para el botón primario (`slate-900`) en el modal de WhatsApp.
- [x] T133 [Frontend] Reemplazar el botón "ELIMINAR" de la lista por un icono de papelera sutil, asegurando que su clic invoque la validación de confirmación estricta ("ELIMINAR") existente.
- [x] T134 [Frontend] Incorporar notificaciones tipo Toast para informar el éxito o error de las acciones de vinculación y desvinculación, y diseñar un estado vacío (Empty State) amigable.

## Fase 32: Multi-Account Gmail Architecture 📧
- [x] T135 [DB] Modificar `schema.prisma`: Eliminar el `@unique` de `id_comercio` en la tabla `ConexionGmail` y añadir `@unique` a `email_conectado`.
- [x] T136 [Backend] Refactorizar `gmail.service.ts` para que `syncEmails` soporte múltiples correos usando `Promise.allSettled()` y crear un nuevo endpoint de Hard Delete para desvincular y revocar el token.
- [x] T137 [Backend] Refactorizar `webhook.controller.ts` para enrutar dinámicamente la sincronización basada en el `emailAddress` extraído del payload.
- [x] T138 [Frontend] Actualizar el `EmailSyncDrawer` para mostrar una lista de cuentas vinculadas, permitiendo "Desvincular" de manera individual y "Vincular otra cuenta".

## Fase 33: Audit UI & Origin Traceability 🕵️‍♂️
- [x] T139 [DB] Modificar `schema.prisma`: Añadir el campo `numero_whatsapp_origen` de tipo `String? @db.VarChar(20)` a la tabla `Transaccion`. NO usar clave foránea (@relation).
- [x] T140 [Backend] Actualizar `whatsapp.controller.ts` para extraer el `phoneNumber` del payload y pasarlo a `processReceiptAndCreateTransaction`. Asegurar de que `transaction.service.ts` reciba este valor y lo persista en la base de datos al crear la transacción y al crear el LogAuditoria.
- [x] T141 [Frontend] Modificar `TransactionsTable.tsx` para mostrar `numero_whatsapp_origen` bajo la sección "Subido por" cuando el canal de ingreso sea WhatsApp.
- [x] T142 [Frontend] Modificar `TransactionsTable.tsx` para agregar la lógica de "Comparación Inteligente" (UX): Si hay `alerta_email` vinculada, comparar `editingTx.monto` con `editingTx.alerta_email.monto`. Si son diferentes, mostrar una alerta naranja (Ej. tooltip o warning icon) indicando la diferencia para prevenir al auditor.

## Fase 34: Smart Filtering & Context Discrimination
- [ ] T124: Modificar `EmailParser` para devolver un tipo de retorno union (success/ignore/error).
- [ ] T125: Añadir cláusulas de guarda Regex para "Nómina" y "Transferencias salientes" (Enviaste plata).
- [ ] T126: Modificar `gmail.service.ts` para verificar `From` (Remitente) y filtrar basuras previo a descargar el cuerpo del mensaje.
- [ ] T127: Descartar silenciosamente los resultados `IGNORE` sin guardarlos en la DLQ.

## Fase 36: Advanced Audit Dashboard (Business Intelligence) 📈
- [ ] T152 [Backend] Refactorizar `report.controller.ts` para agrupar transacciones por banco (`Prisma.groupBy`) y filtrar por rangos horarios estrictos.
- [ ] T153 [Frontend] Instalar `recharts` e integrarlo en `ReportsDashboard` mediante un Donut Chart de estética Dark Premium.
- [ ] T154 [Frontend] Reemplazar inputs de fechas simples por un `Global Filter Bar` con hora/minuto, selectores de Banco y Origen.
- [ ] T155 [Frontend] Enriquecer `TransactionsTable.tsx` cruzando el `numero_whatsapp_origen` con `etiqueta` (alias).
- [ ] T156 [Frontend] Crear el componente `EvidenceDrawer.tsx` (ancho max-w-4xl en escritorio, w-full en móvil) para presentar la comparación visual de OCR vs Foto original.

## Fase 37: Global Logging Optimization & Sanitization 🧹
- [x] T143 [Backend] Instalar Winston, crear `src/utils/logger.ts` y configurar formateo condicional (color en DEV, JSON/texto estricto en PROD).
- [x] T144 [Backend] Refactorizar `whatsapp.controller.ts` para eliminar JSON dump de webhooks y usar logger estructurado.
- [x] T145 [Backend] Refactorizar `email-parser.service.ts` para imprimir error.message en fallos de IA en lugar de payloads gigantes.
- [x] T146 [Frontend] Crear wrapper de consola en `frontend/src/utils/logger.ts` para silenciar logs en producción.
- [x] T147 [Infra] Modificar `docker-compose.yml` para establecer logs de Evolution API y Redis a WARN/ERROR.

## Fase 38: Identity & Login Redesign 🎨
- [x] T148 [UI/UX] Rediseñar `src/app/login/page.tsx` para implementar un patrón de "Split Screen" en escritorio, aplicando estética Dark Premium (slate-900).
- [x] T149 [UI/UX] Implementar carrusel informativo en el panel izquierdo con los 3 mensajes clave: "Automatización de comprobantes...", "Visibilidad centralizada...", y "Trazabilidad operativa...".
- [x] T150 [UI/UX] Aplicar diseño "Abstract UI" con elementos flotantes/cards translúcidos simulando interacciones entre WhatsApp y bancos, sin usar fotos de stock.
- [x] T151 [UI/UX] Asegurar un enfoque Mobile-First estricto: Ocultar completamente el panel narrativo en pantallas pequeñas (`hidden lg:flex`) y garantizar rendimiento visual y de carga.

## Fase 40: Password Recovery with Resend 🔐
- [ ] T157 [DB] Modificar `schema.prisma`: Añadir `reset_password_token` (String?) y `reset_password_expires` (DateTime?) al modelo `Usuario`. Generar y aplicar migración.
- [ ] T158 [Backend] Instalar `resend` SDK y configurar servicio de correos en `src/services/email.service.ts` con HTML profesional y minimalista.
- [ ] T159 [Backend] Crear endpoints de forgot y reset password en `auth.controller.ts` y enlazarlos en `auth.routes.ts`. Implementar Rate Limiting estricto (máx 3 peticiones por hora por email).
- [ ] T160 [Frontend] Actualizar `/login` para añadir enlace "¿Olvidaste tu contraseña?".
- [ ] T161 [Frontend] Crear vistas `/forgot-password` y `/reset-password` heredando estrictamente el patrón Split Screen con estética Dark Premium de la página de Login.

## Fase 41: Legal & Support Infrastructure 🏛️
- [x] T162 [Frontend] Crear vista estática `/terms` (Términos de Servicio) con diseño Dark Premium y borradores legales enfocados en Colombia y responsabilidad de OCR.
- [x] T163 [Frontend] Crear vista estática `/privacy` (Políticas de Privacidad) con diseño Dark Premium, referenciando la Ley 1581 de Habeas Data y el no uso de datos para entrenamiento de IA.
- [x] T164 [Frontend] Crear vista estática `/support` (Centro de Ayuda) minimalista, con FAQs interactivas (acordeón) y botón CTA hacia WhatsApp (+573000000000).
- [x] T165 [Frontend] Actualizar los enlaces del Footer en `src/app/login/page.tsx` para dirigir a `/terms`, `/privacy` y `/support`.

## Fase 42: Production Deployment Cloud Setup ☁️
- [ ] T166 [Infra] Crear `Dockerfile` optimizado (Multi-stage build) para el Backend (Node.js/Express) asegurando instalación de dependencias y generación de Prisma Client.
- [ ] T167 [Infra] Crear `Dockerfile` optimizado para el Frontend (Next.js) configurando el output standalone y optimización de assets.
- [x] T168 [Infra] Crear `docker-compose.yml` en la raíz del proyecto para orquestar la ejecución local de Backend, Frontend y base de datos PostgreSQL, simulando el entorno replicado de producción.
- [x] T169 [Backend] Refactorizar la inicialización del servidor eliminando `node-cron` e implementar un endpoint seguro (ej. `POST /api/v1/cron/reconcile`) protegido mediante validación del header `X-Scheduler-Token` contra `CRON_SECRET_TOKEN`.
- [x] T170 [DevOps] Escribir el script bash `deploy.sh` (o similar) con los comandos secuenciales de gcloud CLI necesarios para compilar las imágenes (Artifact Registry) y desplegarlas en Cloud Run configurando variables de entorno, secretos y conectividad VPC Serverless.

## Fase 35: Adaptive 2D Regex Engine 🧠
- [ ] T171 [Backend] Refactorizar la interfaz `ExtractorRule` en `email.parser.ts` para usar arreglos heurísticos (`amountExtractors`, `senderExtractors`, etc.) con contador de `hits` interno.
- [ ] T172 [Backend] Actualizar el motor de iteración (`EmailParser.parse`) para evaluar nodos de contexto, iterar alternativas y reordenar internamente los arreglos (`sort`) al tener éxito.
- [ ] T173 [Testing] Crear el script `test-adaptive-regex.ts` para correr los archivos `.eml` y `.txt` locales y validar matemáticamente la selección heurística y el reordenamiento.

## Fase 43: Fluid UX & Micro-interactions ✨
- [x] T174 [Frontend] Instalar la dependencia `framer-motion` en el proyecto frontend.
- [x] T175 [Frontend] Crear componentes base UI reutilizables `<Spinner />` y `<Skeleton />` aplicando Tailwind CSS para asegurar la estética Dark Premium.
- [x] T176 [Frontend] Implementar `template.tsx` global en Next.js utilizando Framer Motion para lograr transiciones de ruta minimalistas (Fade-In y Slide-Up corto, 0.2s - 0.3s).
- [x] T177 [Frontend] Refactorizar el botón de Login (`src/app/login/page.tsx` u otros) para usar el componente `<Spinner />` integrando un estado interactivo y bloqueante durante la autenticación.
- [x] T178 [Frontend] Crear archivos `loading.tsx` en las vistas principales del dashboard utilizando el `<Skeleton />` para pre-renderizar la estructura visual y mitigar la carga cognitiva.

## Fase 44: Advanced Reports UI & Mobile Optimization 📱
- [ ] T179 [Frontend] Instalar dependencias `react-datepicker`, `date-fns` y sus types.
- [ ] T180 [Frontend] Crear `CustomDatePicker.tsx` con `react-datepicker`, sobrescribiendo CSS nativo con clases de Tailwind para estética Dark Premium / Glassmorphism.
- [ ] T181 [Frontend] Crear `CustomDropdown.tsx` con React + Tailwind para reemplazar selects nativos, previniendo el truncamiento de nombres en móviles.
- [ ] T182 [Frontend] Refactorizar `ReportsDashboard` (`page.tsx`): Integrar `CustomDatePicker`, `CustomDropdown` y reorganizar layout (`grid-cols-1` en `< md`).
- [ ] T183 [Frontend] Integrar Tabs ("Anomalías" vs "Todas las Transacciones") en el Dashboard de Reportes, conectando la pestaña "Todas" al endpoint `/transactions`.

## Fase 45: Cally DatePicker Implementation 🗓️
- [x] T184 [Frontend] Instalar `cally` en el proyecto frontend y actualizar TypeScript definitions en `next-env.d.ts` o un archivo de declaraciones.
- [x] T185 [Frontend] Refactorizar `CustomDatePicker.tsx` para usar `<calendar-date>`, inyectar selector nativo `<input type="time">` y encapsularlo en un `createPortal`.
- [x] T186 [Frontend] Actualizar `globals.css` para configurar las CSS Custom Properties de Cally respetando la estética Light Premium.

## Fase 46: SaaS Identity & Emotional UX 🎭
- [x] T187 [Frontend] Instalar librería de notificaciones `sonner` e integrarla en el RootLayout (`src/app/layout.tsx`) con estilos Dark Premium.
- [x] T188 [Frontend] Crear componente reutilizable `EmptyState.tsx` con icono SVG, título y descripción empática.
- [x] T189 [Frontend] Modificar el componente principal del Dashboard para incluir un saludo contextual dinámico (Buenos días/tardes/noches) según la hora local.
- [x] T190 [Frontend] Integrar el `EmptyState` en las tablas de transacciones/reportes e implementar Toasts de confirmación (`toast.success`) en las interacciones principales (ej. conciliación manual).

## Fase 47: Unified Filter Architecture (DRY) 🧩
- [x] T191 [Backend] Crear `src/utils/filter.builder.ts` para centralizar la construcción de consultas Prisma (`where`) procesando `fecha_inicio`, `fecha_fin`, `banco`, `origen`, `estado`.
- [x] T192 [Backend] Refactorizar `transaction.controller.ts`, `report.controller.ts` y otros controladores relevantes para usar `buildTransactionFilter()`.
- [x] T193 [Frontend] Crear componente `<SharedFilterBar />` unificando `CustomDatePicker`, `CustomDropdown` y la lógica de estado.
- [x] T194 [Frontend] Refactorizar `/dashboard/page.tsx` y `/dashboard/reports/page.tsx` para usar `<SharedFilterBar />` estandarizando los parámetros de consulta.

## Fase 48: Dashboard Metrics & Filter UI Fix 🛠️
- [x] T195 [Backend] Refactorizar `dashboard.controller.ts` para consumir `buildTransactionFilter()` y estandarizar `fecha_inicio` y `fecha_fin`.
- [x] T196 [Frontend] Refactorizar `SharedFilterBar.tsx` para usar un layout responsivo (Grid dinámico / Flex-wrap) que evite el solapamiento de elementos.
- [x] T197 [Frontend] Corregir contraste de colores en `globals.css` para el componente `<calendar-date>` y habilitar `showTimeSelect` en el `SharedFilterBar`.

## Fase 49: Mobile-First Bottom Sheet UX 📱
- [x] T198 [Spec-Kit] Registrar FR-063 en spec.md y crear tareas de la Fase 49.
- [x] T199 [Frontend] Reconstruir `SharedFilterBar.tsx` con Bottom Sheet animado (framer-motion) para móvil y Grid Card horizontal para escritorio.
- [x] T200 [Frontend] Garantizar z-index correcto del Bottom Sheet y los popups de calendario para evitar recortes.

## Fase 50: Professional UI Refactor & Slide-Over Filters 🏦
- [x] T201 [Spec-Kit] Registrar FR-064 en spec.md y crear tareas de la Fase 50.
- [x] T202 [Frontend] Eliminar emojis del saludo del Dashboard y los selectores de estado (tono corporativo).
- [x] T203 [Frontend] Corregir colores CSS de Cally en `globals.css` respetando `--color-text-on-accent`.
- [x] T204 [Frontend] Refactorizar `SharedFilterBar.tsx` para usar un Drawer (Slide-Over) en escritorio en lugar del Grid fijo.

## Fase 51: WhatsApp Integration Cleanup & Build Fix 🧹
- [x] T205 [Backend] Auditar y corregir `tsconfig.json` en `whatsapp-ingestion/evolution-api` para excluir `node_modules`, `dist`, `**/*.test.ts`, y `media`.
- [x] T206 [DevOps] Eliminar carpeta `dist` inflada y reconstruir build de Evolution API verificando que el tamaño se reduzca de 300MB a unos pocos MB.
- [x] T207 [Backend] Validar dependencias para asegurar que `baileys` cuenta con `@adiwajshing/keyed-db` si es requerido internamente, o confirmar su funcionamiento.

## Fase 52: GCP Resource Provisioning via CLI ☁️
- [x] T208 [DevOps] Generar script automatizado `gcp-setup.sh` con los comandos `gcloud` para habilitar APIs, crear Cloud SQL (`db-f1-micro`), Artifact Registry, Secret Manager y Cloud Scheduler.
- [x] T209 [DevOps] Configurar y documentar el uso de **Cloud SQL Auth Proxy (Unix Sockets)** en lugar del VPC Serverless para garantizar la conexión segura desde Cloud Run de manera gratuita.
