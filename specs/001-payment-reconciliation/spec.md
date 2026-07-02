# Feature Specification: Automatización de Conciliación de Comprobantes (Nequi y Bancolombia)

**Feature Branch**: `001-payment-reconciliation`  
**Created**: 2026-06-28  
**Status**: Draft  
**Input**: User description: "Especificación del Producto: Payo - Módulo 1. Objetivo: Automatizar la conciliación de comprobantes de pago de Nequi y Bancolombia en comercios físicos..."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Ingesta Multicanal y Extracción Automática de Comprobantes (Priority: P1) 🎯 MVP

Como Cajero de un comercio físico, quiero subir comprobantes de pago digitales (vía Panel Web o WhatsApp) para que el sistema extraiga automáticamente los datos del pago (Banco, Monto, Referencia, Fecha) y los registre en estado "Subido sin verificar" asociados a mi comercio (`id_comercio`).

**Why this priority**: Es el núcleo del producto (MVP). Sin la ingesta y extracción de comprobantes, no existen datos que conciliar o mostrar en el dashboard.

**Independent Test**: Se puede probar independientemente subiendo imágenes de comprobantes de Nequi y Bancolombia desde la web o webhook simulado de WhatsApp y verificando que los registros se creen en la base de datos con los campos extraídos y estado "Subido sin verificar".

**Acceptance Scenarios**:

1. **Given** un comprobante válido de Nequi o Bancolombia en imagen, **When** el cajero lo sube desde el panel web o lo envía por WhatsApp, **Then** el sistema procesa el OCR, extrae correctamente Banco, Monto, Referencia y Fecha, y crea una transacción asociada a `id_comercio` con estado "Subido sin verificar".
2. **Given** una imagen de comprobante borrosa o ilegible, **When** el sistema intenta realizar la extracción OCR, **Then** el sistema no se bloquea ni falla; registra la transacción con los campos legibles extraídos (o vacíos) y marca el registro con advertencia de "Revisión requerida" manteniendo el estado "Subido sin verificar".

---

### User Story 2 - Dashboard B2B y Gestión de Estados por el Administrador (Priority: P2)

Como Administrador del comercio, quiero visualizar un panel de control consolidado con las métricas del día y un listado filtrable de transacciones para cambiar su estado a "Verificado manual" o "Rechazado" y corregir datos si fuera necesario.

**Why this priority**: Permite a los administradores del negocio validar los ingresos reales contra sus cuentas bancarias y gestionar excepciones o errores de OCR.

**Independent Test**: Se puede probar alimentando la base de datos con transacciones existentes y verificando que el administrador pueda aplicar filtros por fecha, banco y estado, actualizar el estado de una transacción y visualizar las métricas diarias actualizadas.

**Acceptance Scenarios**:

1. **Given** un listado de comprobantes registrados durante el día, **When** el administrador accede al Dashboard B2B, **Then** visualiza métricas consolidadas (monto total verificado, conteo por banco) y la tabla de transacciones ordenadas cronológicamente.
2. **Given** una transacción en estado "Subido sin verificar", **When** el administrador valida la recepción del dinero en su banco y hace clic en "Verificar", **Then** el estado cambia a "Verificado manual" y se actualizan las métricas del día en tiempo real.
3. **Given** una transacción con datos incompletos por fallo de OCR, **When** el administrador edita manualmente el monto o referencia y confirma, **Then** los datos corregidos se guardan y la transacción queda lista para ser verificada.

---

### User Story 3 - Filtros Avanzados y Auditoría Multi-inquilino (Priority: P3)

Como Administrador de un comercio multi-inquilino, quiero filtrar el historial de comprobantes por rangos de fecha, banco emisor y estado, garantizando que los datos de mi comercio estén totalmente aislados de otros negocios.

**Why this priority**: Proporciona herramientas de consulta histórica y control de auditoría manteniendo el cumplimiento estricto de seguridad multi-tenant.

**Independent Test**: Se puede probar creando transacciones para dos comercios distintos (`id_comercio_A` e `id_comercio_B`) y verificando que las consultas de filtrado del comercio A jamás retornen registros del comercio B.

**Acceptance Scenarios**:

1. **Given** múltiples transacciones en el historial, **When** el administrador aplica un filtro combinado por banco ("Nequi") y estado ("Verificado manual") para una fecha específica, **Then** el sistema retorna únicamente los registros que cumplen exactamente con los criterios para su `id_comercio`.

---

### Edge Cases

- **Comprobante duplicado**: ¿Cómo maneja el sistema cuando se sube dos veces la misma imagen o una imagen con la misma referencia bancaria? El sistema debe detectar la coincidencia de referencia y banco para el mismo `id_comercio` y alertar en la interfaz sobre posible duplicidad sin descartar automáticamente el archivo.
- **Formato de archivo no soportado o corrupto**: Cuando un usuario sube un archivo que no es una imagen válida (JPG, PNG, WEBP), el sistema debe responder con un mensaje claro de error solicitando un formato de imagen válido.
- **Caída de servicio de OCR de tercero (Google Cloud Vision)**: Si la API externa no responde o vence por timeout, el sistema debe guardar la imagen, asignar el estado "Subido sin verificar", e insertar el texto `"Extracción no disponible"` en el campo `notas_revision` para alertar visualmente al administrador de que debe ingresar los datos manualmente.
- **Estandarización de Payload (Multer)**: Para evitar fallos en el middleware de subida (error `Unexpected field`), el endpoint `POST /api/v1/transactions/upload` procesará estrictamente el form-data bajo la llave `image`, rechazando cualquier otro campo.
- **Edición Manual sobre Fallos OCR (Flujo de Respaldo)**: Si el OCR falla extrayendo datos (dejando el banco como `OTROS_BANCOS` -anteriormente `DESCONOCIDO`- o montos en nulo), la lógica de negocio debe insertar `"Extracción no disponible"` en `notas_revision`. La interfaz habilitará la edición manual mediante el endpoint `PATCH /api/v1/transactions/:id`.

## Clarifications

### Session 2026-06-29

- Q: Does `OTROS_BANCOS` entirely replace the `DESCONOCIDO` enum value in the database, or is it just a UI display change? (FR-017) → A: Replace `DESCONOCIDO` entirely with `OTROS_BANCOS` in the DB schema and backend.
- Q: For WhatsApp ingestion (FR-002), how should the system determine the `id_comercio` of an incoming message? → A: Add a `telefono_whatsapp` column to the `Comercio` entity to automatically map sender numbers.
- Q: For the CLI onboarding script (FR-021), how should the initial administrator's password be handled? → A: Generate a strong random password, print it to the console once, and store the hash.


### Session 2026-06-28

- Q: For the manual editing flow (FR-012/T039), should the interface use a separate Modal dialog or Inline expandable rows? → A: Modal dialog - Provides focused context for editing fields and viewing the receipt image simultaneously.
- Q: Does the public upload endpoint require strict rate limiting to prevent abuse or OCR API cost spikes? → A: Strict rate limiting by IP/Tenant - Prevents OCR API cost spikes and denial-of-service abuse.
- Q: How should the dashboard handle large volumes of transactions (Pagination Strategy)? → A: Server-side pagination with page numbers - Easier to implement and integrates perfectly with Next.js SSR.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El sistema DEBE proveer un punto de entrada web (Panel Web) para la carga de imágenes de comprobantes bancarios.
- **FR-002**: El sistema DEBE proveer un punto de integración via Webhook para la ingesta automatizada de comprobantes desde WhatsApp Cloud API.
- **FR-003**: El sistema DEBE analizar mediante OCR y parsers especializados las imágenes ingresadas para extraer automáticamente: Banco emisor (`Nequi` o `Bancolombia`), Monto (`monto`), Número de Referencia (`referencia`), y Fecha/Hora de la transacción (`fecha_transaccion`).
- **FR-004**: El sistema DEBE asignar el estado inicial `"Subido sin verificar"` a toda nueva transacción registrada en la plataforma.
- **FR-005**: El sistema DEBE asegurar que cada transacción esté estrictamente vinculada a un identificador único de comercio (`id_comercio`), garantizando la separación de datos en todas las consultas y almacenamiento.
- **FR-006**: El sistema DEBE permitir al usuario Administrador actualizar el estado de una transacción a `"Verificado manual"` o `"Rechazado"`.
- **FR-007**: El sistema DEBE permitir al usuario Administrador editar o corregir manualmente los campos extraídos (Monto, Referencia, Banco, Fecha) cuando la extracción automática presente fallos o inconsistencias.
- **FR-008**: El panel de control (Dashboard B2B) DEBE desplegar las métricas acumuladas del día (Monto Total Verificado, Cantidad de Comprobantes por Estado y por Banco) y actualizarse dinámicamente.
- **FR-009**: El Dashboard B2B DEBE ofrecer capacidades de filtrado de transacciones por Rango de Fechas, Banco (`Nequi`, `Bancolombia`) y Estado (`Subido sin verificar`, `Verificado manual`, `Rechazado`), implementando **paginación del lado del servidor (server-side pagination)**.
- **FR-010 (Interfaz de Carga):** El frontend debe proveer un componente visual interactivo (Drag & Drop o botón de selección) para la carga manual de comprobantes, el cual debe conectarse a `POST /api/v1/transactions/upload`. Debe manejar visualmente estados de carga (loading spinners) y mostrar alertas de error. El endpoint backend debe aplicar **límites de tasa estrictos (rate limiting) por IP/Inquilino** para prevenir abusos.
- **FR-011 (Layout y Navegación Mobile-First):** La aplicación debe contar con un Layout principal estrictamente Mobile-First. En dispositivos móviles, la navegación principal debe transformarse en una Bottom Tab Bar (Barra de navegación inferior) o un menú Hamburger accesible, reorganizando los botones para el uso táctil con una sola mano.
- **FR-012 (Dashboard Dinámico y Edición):** La tabla de transacciones en el frontend debe actualizarse dinámicamente y debe incluir un **Modal Dialog dedicado** que permita al administrador editar manualmente el Banco, Monto, Referencia y Fecha consumiendo el endpoint `PATCH`, asegurando contexto visual del comprobante original.
- **FR-013 (Estética Ejecutiva y Confianza B2B):** El sistema de diseño DEBE transmitir confianza corporativa y seguridad financiera ("tipo banco"). Queda estrictamente prohibido el uso de colores pastel. La paleta debe ser minimalista, sobria y ejecutiva, basada en Tonos Navy (Azul Marino Oscuro), Slate (Gris Pizarra) y Blanco Puro. Todos los valores monetarios deben formatearse estrictamente a Pesos Colombianos (COP).
- **FR-015 (Localización Completa):** Toda la interfaz de usuario, incluyendo placeholders, etiquetas y opciones de los filtros (`AdvancedFilters.tsx`), debe estar estrictamente en Español.
- **FR-017 (Categorización de Bancos - Otros Bancos):** El sistema se especializa en Nequi y Bancolombia. Cualquier comprobante cuyo banco no sea identificado o pertenezca a otra entidad debe asignarse automáticamente a la categoría "OTROS_BANCOS", eliminando términos de error u opacidad en la interfaz.
- **FR-018 (Filtros de Fecha Reactivos):** Al modificar los rangos de fecha (fecha de inicio y fin) en el panel de filtros, el frontend debe disparar peticiones automáticas al backend para recalcular y actualizar dinámicamente tanto las métricas generales como las filas de la tabla de transacciones.
- **FR-019 (Interfaz de Ventana Única Unificada):** Se elimina la separación de pantallas entre "Dashboard" y "Subir Comprobante". Toda la operación principal del cajero ocurre en una única vista donde coexisten el componente de carga (`UploadDropzone.tsx`), las tarjetas de métricas reactivas y el listado de transacciones.
- **FR-020 (Protección Estricta de Rutas - Auth Guard):** Queda estrictamente prohibido el acceso a rutas privadas del panel (ej. `/dashboard`, `/transactions`) a usuarios no autenticados. El frontend debe interceptar los accesos y validar la vigencia del token JWT, redirigiendo inmediatamente a `/login` en caso de fallo.
- **FR-021 (Onboarding de Comercios en MVP):** El registro y aprovisionamiento de nuevos comercios multi-tenant se gestionará de manera interna mediante un script seguro de aprovisionamiento por línea de comandos (CLI) ejecutado por el equipo de ingeniería. El script generará una contraseña aleatoria fuerte, la imprimirá en consola una vez y almacenará su hash, evitando el desarrollo de una interfaz gráfica de súper-admin en esta fase.
- **FR-022 (Minimalismo en Tarjeta de Monto Total):** La tarjeta de "Monto Total Reportado" en el Dashboard debe rediseñarse hacia un estilo ultra-minimalista, limpio y sobrio. Debe evitar saturación de fondos o bordes gruesos. Se calculará sumando **únicamente** los comprobantes en estado "Verificado" y "Por Verificar" (excluyendo rechazados o duplicados). Esta tarjeta debe comunicar solidez contable.
- **FR-023 (Zona de Cuarentena para Duplicados):** Cuando el sistema detecte un posible comprobante duplicado (misma referencia, monto y banco), no debe rechazarlo con un error duro. Debe guardarlo con el estado `DUPLICADO_SOSPECHOSO` vinculándolo al id original. El frontend debe tener un apartado o modal dedicado a "Resolución de Duplicados" donde el administrador vea la foto original y la nueva lado a lado, ofreciendo dos acciones: "Descartar Duplicado" o "Forzar Aprobación (Falso Positivo)".
- **FR-024 (Corrección y Separación de Interfaz de Carga):** El componente de ingesta debe estar fuertemente optimizado para dispositivos móviles y renderizar una vista previa. Para lograrlo, se deben **separar completamente de forma visual y funcional** el botón o área para "Subir Imagen (Galería/Archivo)" y el botón explícito para "Tomar Foto" (usando `capture="environment"`). Esta separación evitará conflictos de eventos y garantizará que la cámara nativa se abra correctamente en móviles.
- **FR-025 (Conciliación Automática o "Match" Estricto):** El sistema debe cruzar automáticamente los comprobantes subidos con las alertas de correo electrónico ingresadas. El cruce exige una igualdad matemática estricta (=) sin ventanas de tiempo. Un "Match" exitoso solo ocurrirá si coinciden: ID del Comercio, Banco, Monto, Referencia (o Nombre Remitente para Bre-B), y la Fecha_Hora (minuto a minuto, truncando segundos). Los correos NUNCA tienen permitido crear transacciones; su único propósito es actualizar transacciones a VERIFICADO_SISTEMA.
- **FR-026 (Nuevo Estado - VERIFICADO_SISTEMA):** Cuando ocurra un Match exitoso (ya sea impulsado por la subida de la imagen o por la llegada del correo), la transacción debe cambiar su estado a `VERIFICADO_SISTEMA` y guardar una llave foránea (`id_alerta_email`) que la vincule con el correo original. El frontend debe mostrar este estado con un distintivo visual único (ej. color verde y un icono de sistema/correo) para diferenciarlo de las verificaciones hechas manualmente por humanos.
- **FR-027 (Motor híbrido Regex + Gemini Fallback):** El 100% de los correos entrantes se procesarán inicialmente mediante Regex locales para optimizar costos. Si el parser falla (o detecta pagos "Bre-B" sin referencia), Google Gemini (en JSON Mode) se activará exclusivamente como respaldo para extraer los datos basándose estrictamente en la fecha/hora interna del texto del correo. Los correos irrecuperables se enviarán a una Cola de Errores (Dead Letter Queue) alojada en la configuración.
- **FR-028 (Protección de Correos frente a Duplicados):** Si llega un comprobante que es detectado como `DUPLICADO_SOSPECHOSO`, el motor de Match debe ignorarlo y NO robar la vinculación de un correo que ya fue conciliado por la transacción original.
- **FR-029 (Cruce Manual):** Si el OCR falla y la transacción queda `SUBIDO_SIN_VERIFICAR`, el administrador debe tener una opción en la UI para "Vincular Manualmente" la transacción con un correo pendiente, cambiando el estado a `VERIFICADO_MANUAL` pero guardando el `id_alerta_email`.
- **FR-030 (Auditoría de Comprobantes)**: Búsqueda avanzada por teléfono, fecha/hora exacta y canal con modo de renderizado diferido (Lazy Loading) de imágenes.
- **FR-031 (Cierre de Caja Analítico)**: Agregaciones financieras instantáneas por banco y estado contable.
- **FR-032 (Trazabilidad Inmutable)**: Registro mandatorio de acciones críticas del personal en una tabla aislada.
- **FR-033 (Reporte de Anomalías)**: Agrupación inteligente de intentos de fraude o duplicados reincidentes.
- **FR-034 (Límites de WhatsApp)**: El sistema DEBE limitar la cantidad de números de WhatsApp vinculados a un máximo de 5 por comercio para prevenir abusos.
- **FR-035 (WhatsApp Security & RBAC y Auditoría)**: Queda estrictamente prohibido que usuarios sin el rol `ADMINISTRADOR` agreguen o eliminen números vinculados. Cualquier cambio en la vinculación de WhatsApp debe registrarse de manera centralizada en la tabla `LogAuditoria`.
- **FR-036 (UI Mobile-First para Confirmación Estricta)**: La interfaz de usuario debe prevenir eliminaciones accidentales de números de WhatsApp exigiendo que el usuario escriba textualmente la palabra "ELIMINAR" dentro de un componente tipo Bottom Sheet (no modales clásicos) optimizado para pantallas táctiles.
- **FR-037 (Motor de Parseo Regex Adaptativo)**: El sistema implementará un motor de extracción de texto basado en patrones heurísticos optimizables (Priority Queue). Este motor debe ejecutar obligatoriamente una fase de Sanitización Previa (HTML Stripping) para remover etiquetas y espacios irrompibles antes de analizar correos en formato crudo. Todas las reglas exitosas incrementarán su contador de uso (Self-optimizing). Finalmente, todas las fechas extraídas deben ser parseadas de forma estricta (usando librerías como `date-fns` o parseo manual estricto) desde formatos DD/MM para evitar la inversión de días y meses al convertir a formato ISO.
- **FR-038 (Zero-Trust WhatsApp Firewall)**: Queda estrictamente prohibido procesar payloads, descargar medios de Google Cloud o invocar el OCR si el número remitente del mensaje de WhatsApp no existe en la tabla `NumeroWhatsApp`. El webhook debe implementar una caché en memoria (Whitelist Cache) que valide esto en < 1ms, abortando peticiones de spam sin sobrecargar las conexiones a PostgreSQL.
- **FR-050 (Advanced Analytics & Evidence Auditing)**: Transformar el módulo de Reportes en un panel de BI con filtros de turnos de alta precisión (fechas y horas exactas), agrupación de transacciones por banco (`Prisma.groupBy`) y un Panel Lateral (Drawer) de evidencia visual. Mostrará el alias del cajero combinando el `numero_whatsapp_origen` y el campo `etiqueta` de `NumeroWhatsApp`.
- **FR-051 (Brand Identity & Marketing Login)**: La página de inicio de sesión debe implementar un patrón de diseño "Split Screen" (Pantalla Dividida) en escritorio, con una estética Dark Premium / Glassmorphism. El panel narrativo (oculto en móviles) debe comunicar la propuesta de valor con un estilo "Abstract UI" y copy realista enfocado en la automatización de comprobantes, visibilidad centralizada y trazabilidad operativa.
- **FR-055 (Cloud Infrastructure & Deployment Architecture)**: El sistema se desplegará en Google Cloud Platform (GCP). El Frontend (Next.js) y Backend (Node.js) se empaquetarán en contenedores Docker y se desplegarán en Cloud Run. La base de datos será Cloud SQL (PostgreSQL) aislada en una red virtual privada (VPC). Las tareas programadas (`node-cron`) se migrarán a endpoints HTTP protegidos por un token secreto (`CRON_SECRET_TOKEN`) y gatillados por Google Cloud Scheduler para asegurar alta disponibilidad y prevenir ejecuciones duplicadas en instancias auto-escalables.
### Key Entities

- **Comercio (Tenant)**: Representa la entidad B2B multi-inquilino. Atributos principales: `id_comercio` (UUID), `nombre_comercio`, `telefono_whatsapp` (String, Unique), `fecha_registro`, `estado_activo`.
- **Comprobante / Transacción**: Representa cada pago ingresado para conciliación. Atributos principales: `id_transaccion` (UUID), `id_comercio` (UUID, FK), `banco` (Enum: NEQUI, BANCOLOMBIA, OTROS_BANCOS), `monto` (Decimal), `referencia` (String), `fecha_transaccion` (DateTime), `url_imagen` (String), `canal_ingreso` (Enum: WEB, WHATSAPP), `estado` (Enum: SUBIDO_SIN_VERIFICAR, VERIFICADO_MANUAL, RECHAZADO), `confianza_ocr` (Float/JsonMetadata), `fecha_creacion` (DateTime), `fecha_actualizacion` (DateTime).
- **Usuario**: Representa los cajeros y administradores del sistema. Atributos principales: `id_usuario` (UUID), `id_comercio` (UUID, FK), `email` (String), `rol` (Enum: CAJERO, ADMINISTRADOR).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: El tiempo total de procesamiento desde la recepción de la imagen vía Web es menor a 4 segundos en el 95% de los casos. La recepción e ingesta automatizada por webhook de WhatsApp se realiza en menos de 2 segundos.
- **SC-002**: El analizador de texto (Parser) logra una precisión de extracción correcta de Monto, Referencia, Banco y Fecha superior al 92% en imágenes legibles de comprobantes de Nequi y Bancolombia.
- **SC-003**: Los administradores pueden filtrar y actualizar el estado de un comprobante en menos de 2 clics desde la pantalla principal del Dashboard.
- **SC-004**: El 100% de las consultas a base de datos y endpoints de API aplican de forma estricta la cláusula de aislamiento por `id_comercio`, registrando cero incidentes de fuga de datos entre inquilinos.
- **SC-005**: Ante fallos totales o latencias de APIs de terceros (Google Vision / WhatsApp), el 100% de las imágenes recibidas quedan almacenadas y disponibles para conciliación manual sin pérdida de información.

## Assumptions

- Se asume que las imágenes cargadas corresponden a comprobantes oficiales de las aplicaciones móviles de Nequi y Bancolombia en Colombia.
- Se asume que el comercio cuenta con credenciales activas y configuradas para la API de WhatsApp Cloud en caso de utilizar la ingesta por dicho canal.
- Se asume que la zona horaria predeterminada para el cálculo de métricas diarias es la hora local de Colombia (America/Bogota, UTC-5).
- Para el MVP, el almacenamiento de imágenes utilizará políticas de retención estándar en buckets de nube con URLs firmadas para acceso seguro.

### Fase 28: Webhooks y Sincronización Real-Time
- **FR-039 (Conciliación Real-Time Pub/Sub)**: El sistema debe escuchar eventos Push de Gmail para desencadenar la sincronización inmediatamente, abandonando métodos de polling.
- **FR-040 (Renovación Automática de Watch)**: El sistema debe asegurar la renovación automática del endpoint de escucha antes de su caducidad estipulada por Google (7 días).

### Fase 29: UX Redesign - Email Sync Drawer
- **FR-041 (Drawer Lateral para Correos):** La interfaz de sincronización de correos, buzón de huérfanos y cola de errores debe implementarse como un Panel Lateral (Side Drawer) en lugar de un modal pequeño, permitiendo mostrar tablas completas sin sacar al usuario del contexto del dashboard.
- **FR-042 (Accionabilidad en Buzón de Huérfanos):** El buzón de huérfanos debe ser 100% accionable, incluyendo la funcionalidad de 'Vincular Manualmente' para permitir al administrador enlazar correos no procesados con transacciones existentes.
- **FR-043 (Renderizado Visual en DLQ):** La Cola de Errores (DLQ) no debe mostrar código HTML crudo. Se deben extraer metadatos útiles (Remitente, Asunto, etc.) y proveer un renderizado visual seguro (ej. iframe) del correo original para facilitar su interpretación.

### Fase 30: Frontend Optimization & Enriched Transaction Details
- **FR-044 (Carga Diferida por Defecto - "Today"):** El Dashboard y los filtros deben inicializarse con la fecha actual (hoy) para prevenir consultas pesadas a la base de datos en el renderizado inicial y mostrar métricas de "Cierre de Caja". El botón "Limpiar" debe borrar las fechas para permitir ver el historial completo (apoyado por la paginación).
- **FR-045 (Metadatos de Auditoría en UI):** El modal de Detalles de Transacción debe enriquecerse visualmente mostrando el Canal de Ingreso (WEB/WHATSAPP), el Creador de la transacción y el Remitente detectado mediante OCR, proporcionando a los administradores todo el contexto necesario para conciliación.

### Fase 31: WhatsApp UI/UX Refinement
- **FR-046 (WhatsApp Management UI):** El apartado de WhatsApp debe rediseñarse como un Panel Lateral (Drawer) o Bottom Sheet (en móviles), en lugar de un modal genérico, para mantener la consistencia con la sincronización de correos. Debe implementar validaciones en tiempo real, máscara de entrada (Input Masking) para asegurar el formato de país, spinners de carga para el botón principal (color `slate-900`) y notificaciones tipo Toast para éxito/error. La lista de números vinculados debe usar un ícono de papelera para eliminar, el cual gatillará el flujo de confirmación estricta ("ELIMINAR") ya definido en la Fase 24.

### Fase 32: Multi-Account Gmail Architecture
- **FR-047 (Arquitectura Multicuenta de Gmail):** La plataforma debe soportar la vinculación de múltiples cuentas de correo (Ej. una para Nequi, otra para Bancolombia) por comercio (relación 1 a Muchos). El Webhook debe enrutar la sincronización dinámicamente mediante el `emailAddress` del payload de Pub/Sub. La sincronización global debe utilizar `Promise.allSettled()` para garantizar resiliencia (si una cuenta falla, las demás se sincronizan). El Frontend (EmailSyncDrawer) debe listar las cuentas, permitir añadir nuevas y desvincularlas individualmente mediante Hard Delete (revocando el token de Google).
- **FR-048:** (Trazabilidad de Origen y Comparación OCR vs Email) Se registrará y persistirá como texto el número telefónico desde el cual se cargaron los comprobantes vía WhatsApp. Adicionalmente, la interfaz presentará una comparativa inteligente entre los datos extraídos (monto) por OCR y los reportados en el correo vinculado, emitiendo alertas visuales ante posibles discrepancias.

### Fase 34: Smart Filtering & Context Discrimination
- **FR-049 (Filtrado de Contexto y Discriminación de Spam):** El sistema debe prevenir la contaminación de la Cola de Errores (DLQ) mediante un pre-filtro que evalúe estrictamente los headers del correo (From), descartando de inmediato dominios no bancarios. Además, el motor de extracción debe estar dotado de discriminación de contexto direccional, descartando silenciosamente transacciones salientes ("enviaste plata") y pagos de nómina al no corresponder al ámbito B2B.

### Fase 40: Password Recovery with Resend
- **FR-053 (Self-Service Password Recovery):** El sistema debe permitir a los usuarios restablecer su contraseña de manera autónoma utilizando el SDK de Resend para el envío de correos. Para proteger la capa gratuita (100 correos/día), el endpoint debe implementar un estricto Rate Limiting (máximo 3 solicitudes por correo electrónico en una ventana de 1 hora). El token de recuperación expirará exactamente en 1 hora y será eliminado de la base de datos tras su uso exitoso. La interfaz de las vistas `/forgot-password` y `/reset-password` debe mantener estrictamente el diseño de Pantalla Dividida (Split Screen) con estética Dark Premium de la página de Login.

### Fase 41: Legal & Support Infrastructure
- **FR-054 (Legal & Support Static Pages):** El sistema debe proveer páginas estáticas públicas para Términos de Servicio (`/terms`), Políticas de Privacidad (`/privacy`), y Centro de Soporte (`/support`). Las páginas legales deben incluir borradores profesionales adaptados al contexto colombiano (Ley 1581) y aclarar las exenciones de responsabilidad del OCR. El Centro de Soporte debe presentar FAQs interactivas y un llamado a la acción hacia WhatsApp. Todas deben compartir el diseño Dark Premium.

### Fase 35: Adaptive 2D Regex Engine
- **FR-056 (Adaptive 2D Regex Engine & Self-Optimizing Queue):** El sistema de parseo de correos electrónicos evolucionará de reglas monolíticas a un motor heurístico bidimensional. Cada regla mantendrá su contador de prioridad principal (`hits`), pero reemplazará el Regex estricto por un Grafo de Nodos de contexto y Arreglos de Micro-Alternativas (Monto, Fecha, Remitente). Estas alternativas competirán internamente, reordenándose según su efectividad transaccional (Deep Learning Heurístico), garantizando que el sistema aprenda y se recupere automáticamente ante variaciones en las plantillas bancarias.

### Fase 43: Fluid UX & Micro-interactions
- **FR-057 (Global UX/UI & Fluid Transitions):** El sistema debe implementar transiciones de ruta fluidas utilizando `framer-motion` (estilo Fade-In y Slide-Up rápido, 0.2s - 0.3s) y Loading States (Skeleton Screens y Spinners) usando la arquitectura de Next.js (`template.tsx` y `loading.tsx`). El diseño debe mantener una estética Dark Premium estricta combinando Tailwind CSS y Framer Motion, evitando librerías de componentes UI pesadas.

### Fase 44: Advanced Reports UI & Mobile Optimization
- **FR-058 (Mobile-Responsive Advanced Audit & Custom Filters):** El Panel de Reportes debe proveer una experiencia Mobile-First estricta. Los selectores de fechas deben usar `react-datepicker` con estilos sobrescritos a Dark Premium/Glassmorphism mediante Tailwind. Los selectores de origen deben usar un componente `CustomDropdown` sin truncamientos de texto. La auditoría debe presentar pestañas (Tabs) para alternar entre "Anomalías" y "Todas las Transacciones" consumiendo eficientemente el backend.

### Fase 45: Cally DatePicker Implementation
- **FR-059 (Lightweight Date & Time Picker Migration):** Reemplazar `react-datepicker` por `cally` (Web Component) para la selección de fechas. Se debe implementar un selector de horas customizado (input type="time") integrado en el Popover de Cally. El calendario flotante DEBE ser renderizado mediante un React Portal a nivel raíz (`document.body`) para evitar recortes visuales causados por contenedores con `overflow: hidden`, asegurando que siempre se despliegue correctamente sin importar su anidación, respetando la estética Light Premium.

### Fase 46: SaaS Identity & Emotional UX
- **FR-060 (Emotional UX & Identity Elements):** Incorporar elementos de identidad visual para transformar la experiencia B2B. Implementar "Empty States" empáticos y visualmente pulidos (Dark Premium) cuando no existan transacciones o errores. El Dashboard principal debe presentar un saludo contextual dinámico ("Buenos días", "Buenas tardes", etc.) según la hora local del dispositivo. Se debe integrar un sistema de notificaciones no intrusivo (Micro-interacciones/Toasts, ej. `sonner`) que provea retroalimentación visual inmediata en color esmeralda (accent color) ante operaciones exitosas como conciliaciones manuales o actualizaciones de filtros.

### Fase 47: Unified Filter Architecture (DRY)
- **FR-061 (Unified Filter Architecture):** Implementar el principio DRY centralizando la lógica de filtrado en toda la plataforma. En el Backend, se debe crear un constructor de consultas (Query Builder) compartido que procese `fecha_inicio`, `fecha_fin`, `banco`, `origen`, `estado`, e `id_comercio` devolviendo el objeto `where` de Prisma, siendo consumido por todos los controladores (transacciones, reportes). En el Frontend, se debe unificar la barra superior en un componente reutilizable `<SharedFilterBar />` que gestione de manera idéntica los selectores y el estado en el Dashboard y en Auditoría, estandarizando toda la nomenclatura de parámetros.

### Fase 48: Dashboard Metrics & Filter UI Fix
- **FR-062 (Dashboard Metrics Sync & Responsive Filters):** Refactorizar el controlador de métricas del Dashboard para que consuma la utilidad centralizada de filtros (`buildTransactionFilter`) garantizando consistencia matemática con las tablas. En el Frontend, aplicar un diseño Mobile-First y responsivo real (Grid dinámico / Flex-wrap) para la barra de filtros compartida, asegurando que los selectores no colapsen visualmente. Corregir los colores del selector de fechas Cally para mejorar el contraste y habilitar correctamente la selección de horas.

### Fase 49: Mobile-First Bottom Sheet Filter UX
- **FR-063 (Mobile-First Bottom Sheet Filter UI):** Implementar el patrón de diseño "Bottom Sheet" (Cajón inferior flotante) para la barra de filtros en dispositivos móviles (`< md`). En pantallas pequeñas, un botón `Filtros` abre un cajón animado con `framer-motion` que emerge desde la parte inferior de la pantalla, con fondo semi-transparente (backdrop). Los botones "Aplicar" y "Limpiar" estarán anclados (sticky) en la parte inferior del cajón. En pantallas de escritorio (`md+`), el componente se presenta como una Card horizontal con Grid de 2-3 columnas que no colapsa. Los calendarios de Cally y sus popups deben tener `z-index` superior para nunca ser recortados.

### Fase 50: Professional UI Refactor & Slide-Over Filters
- **FR-064 (Corporate Tone & Slide-Over Filter Architecture):** Establecer un tono bancario estricto en el frontend eliminando el uso de emojis en saludos y estados. Refactorizar la arquitectura de `SharedFilterBar` para que en escritorio (`md+`) se despliegue como un panel lateral derecho (Slide-Over / Drawer) en lugar de un Grid fijo, optimizando el uso del espacio en pantalla. Corregir el contraste del calendario (Cally) utilizando las variables CSS nativas (`--color-text-on-accent` y `--color-accent`) para asegurar que el día seleccionado sea perfectamente legible.

### Fase 51: WhatsApp Integration Cleanup & Build Fix
- **FR-065 (WhatsApp API Storage & Build Optimization):** El sistema Evolution API debe mantener un tamaño de compilación (build) óptimo (pocos MB). El `tsconfig.json` debe incluir reglas estrictas de exclusión (`["node_modules", "dist", "**/*.test.ts", "media"]`) para evitar que copias redundantes inflem la carpeta `dist`. Así mismo, se debe asegurar la presencia de las dependencias requeridas para que el motor de WhatsApp (Baileys) funcione correctamente tras limpiezas de paquetes.

### Fase 52: GCP Resource Provisioning via CLI
- **FR-066 (Cost-Optimized GCP Infrastructure):** La infraestructura de producción en Google Cloud Platform debe provisionarse de forma automatizada (Infrastructure as Code) mediante scripts basados en gcloud CLI (`gcp-setup.sh`), eliminando la creación manual desde la consola web. El aprovisionamiento debe utilizar recursos de bajo costo optimizados para el MVP: base de datos PostgreSQL `db-f1-micro` y conexión segura mediante **Cloud SQL Auth Proxy (Unix Sockets)** nativo de Cloud Run, evitando el uso costoso de Conectores Serverless VPC, mientras se mantiene el estándar de seguridad.
