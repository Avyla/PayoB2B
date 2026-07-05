# Payo B2B

## Propósito del Proyecto
Payo B2B es un SaaS multi-inquilino diseñado para automatizar la conciliación de comprobantes de pago digitales (Nequi y Bancolombia). Permite verificar pagos vía WhatsApp o Web de manera instantánea, mitigando fraudes y agilizando la operación en caja para comercios físicos B2B.

## Audiencia Objetivo
Cajeros, administradores de comercios y personal de contabilidad en Colombia que operan comercios físicos B2B.

## Características Principales
- **Velocidad y Eficiencia:** El estado de un pago (Aprobado/Rechazado/Pendiente) es visible en menos de 2 segundos.
- **Degradación Grácil:** Si un comprobante no se cruza automáticamente, la interfaz guía suavemente a la revisión manual.
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
