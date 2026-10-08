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

## Permisos

COORDINACION (nombre visible: Responsable Comercial): gestión comercial general, contacto con clientes, cotizaciones, cierre de ventas, renovaciones y asignación de oportunidades. DIRECCION: reportes globales, creación y gestión de oportunidades propias. ASESOR: creación y edición de oportunidades propias. ADMIN: administración comercial y técnica. Todos consultan el directorio, sin acceso a chats personales.

## Pendiente para producción

Pruebas de integración, migraciones revisadas, HTTPS, respaldos, observabilidad, gestión de secretos, validación de permisos y configuración de correo. No desplegar en el servidor productivo sin revisión.
