# MIDA CRM 360°

CRM comercial independiente para MIDA: prospectos, renovaciones, venta cruzada, clientes, oportunidades, actividades y reportes.

## Inicio

1. Copiar `.env.example` a `.env` y configurar PostgreSQL **independiente**.
2. `npm install`
3. `npx prisma db push`
4. `npm run seed` (solo entorno de desarrollo)
5. `npm run dev`

Usuarios demo tras seed: `dulce@mida.local`, `direccion@mida.local`, `asesor@mida.local`. Contraseña configurada mediante `SEED_PASSWORD` (mínimo 12 caracteres).

**No conectar bases de producción.** Licencias MIDA es otro sistema; futura integración únicamente mediante API de consulta con credenciales de mínimo privilegio. El MVP no lee conversaciones personales de WhatsApp.

## Funciones

Inicio por rol, directorio de clientes, oportunidades por etapa, alta de clientes y oportunidades, cambio de etapa autorizado, actividades, reportes agregados y vínculo WhatsApp.

## Renovaciones (desarrollo sin conexión a Licencias MIDA)

- Crear una oportunidad con tipo `RENOVACION` y fecha objetivo (manual).
- Consultar cola de trabajo en la pantalla **Renovaciones**, con prioridades: vencida, próximos 30 días, programada, sin fecha y cerrada.
- Responsable Comercial y administrador pueden ajustar fechas de todas las renovaciones; asesores y Dirección únicamente las propias.
- La fecha es **objetivo comercial**, no una vigencia certificada. Hasta que se implemente la API de Licencias MIDA, el CRM no puede confirmar fechas de vencimiento de certificados.
- Endpoint autenticado `GET /api/renewals` con `?scope=mine` opcional. No existe integración de escritura con Licencias MIDA.

## Cotizaciones

Se agregó entidad `Quote`, API autenticada `/api/quotes` y pantalla **Cotizaciones**. Permite crear borradores por oportunidad, registrar subtotal/impuesto/total, vigencia y transiciones `BORRADOR → ENVIADA → ACEPTADA/RECHAZADA/VENCIDA`. Cada cambio de estado deja auditoría. Los asesores solo gestionan cotizaciones de oportunidades propias; coordinación y administrador gestionan todas. No se envían correos, no se genera PDF ni CFDI y el registro no equivale a facturación. **Pendiente de validar compilación y aplicar esquema en una base de desarrollo** mediante `npx prisma db push` (nunca sobre producción sin migración revisada).

## Agenda comercial

Las actividades pendientes se ordenan por fecha, con indicadores de vencidas, hoy, próximos siete días y sin fecha. El dashboard muestra vencidas y permite marcar actividades completadas o reabrirlas conforme a los permisos existentes. Los avisos son **visuales dentro del CRM**; no se ha implementado el envío automático de correos ni mensajes de WhatsApp. Las fechas se interpretan según la zona horaria del navegador para los indicadores visuales; antes de producción deberá fijarse una zona horaria de negocio común.

## Supervisión comercial

Pantalla y API `/api/supervision` exclusivas para Responsable Comercial, Dirección y Administrador. Resume actividades vencidas, oportunidades abiertas sin actividades en los últimos 7 días, renovaciones con fecha objetivo dentro de 30 días y conteos por asesor. Son alertas internas, no notificaciones push, correo ni WhatsApp. Los vencimientos de renovaciones son fechas comerciales manuales, no certificados de Licencias MIDA.

## Permisos

COORDINACION (nombre visible: Responsable Comercial): gestión comercial general, contacto con clientes, cotizaciones, cierre de ventas, renovaciones y asignación de oportunidades. DIRECCION: reportes globales, creación y gestión de oportunidades propias. ASESOR: creación y edición de oportunidades propias. ADMIN: administración comercial y técnica. Todos consultan el directorio, sin acceso a chats personales.

## Pendiente para producción

Pruebas de integración, migraciones revisadas, HTTPS, respaldos, observabilidad, gestión de secretos, validación de permisos y configuración de correo. No desplegar en el servidor productivo sin revisión.

## Supervisión comercial

El panel **Supervisión** está disponible para ADMIN, COORDINACION (Responsable Comercial) y DIRECCION. Resume actividades vencidas, oportunidades abiertas sin actividad durante siete días, renovaciones con fecha próxima y carga por asesor. Desde el panel se pueden completar tareas autorizadas o abrir la Agenda con una oportunidad preseleccionada para programar seguimiento. Los datos se actualizan tras registrar cambios. No envía notificaciones automáticas y no accede a sistemas de producción.
