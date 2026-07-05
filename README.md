# Payo B2B

## Propósito del Proyecto
Payo B2B es una herramienta de automatización diseñada para agilizar el conteo y validación de comprobantes de pago digitales (Nequi y Bancolombia). El sistema funciona cruzando la información leída de los comprobantes con las notificaciones de los correos electrónicos bancarios.

> [!WARNING]
> **Descargo de Responsabilidad Importante:** Payo B2B es estrictamente una herramienta de automatización administrativa y de conciliación visual. **No es una pasarela de pagos, no procesa transacciones financieras y NO garantiza ni da certeza de que el dinero haya sido efectivamente abonado a la cuenta bancaria.** El uso de esta plataforma es únicamente como una ayuda operativa para organizar comprobantes y correos. La responsabilidad final de confirmar los fondos en la cuenta bancaria recae enteramente en el comercio.

## Audiencia Objetivo
Cajeros, administradores de comercios y personal de contabilidad en Colombia que operan comercios físicos B2B.

## Características Principales
- **Velocidad y Eficiencia:** El resultado del cruce de datos es visible de forma rápida.
- **Asistencia Operativa:** Si un comprobante no se cruza automáticamente, la interfaz asiste para una revisión manual.
- **Confianza y Seguridad:** Diseño limpio, moderno y eficiente que transmite seguridad financiera.
- **Accesibilidad:** Alto contraste para pantallas de punto de venta (POS) y estados claros con iconos y colores.

## Tecnologías Utilizadas
- **Backend:** Node.js, Express, TypeScript, Prisma.
- **Frontend:** Next.js, React, TypeScript, TailwindCSS.
- **Infraestructura:** Google Cloud Platform (Cloud SQL, GCS, Pub/Sub, etc.).

## Estructura del Repositorio
- `/backend`: Contiene la API REST, controladores, servicios y lógica de conciliación.
- `/frontend`: Contiene la aplicación web Next.js.
- `/specs`: Especificaciones técnicas y de producto.

## Licencia
Este proyecto está licenciado bajo la licencia MIT. Para más detalles, consulta el archivo [LICENSE](LICENSE).
