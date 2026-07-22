# Plan de Implementación SaaS Multi-tenant

Este documento describe la arquitectura y los pasos para adaptar el frontend del sistema GymControl y convertirlo en un Software as a Service (SaaS) multi-tenant, complementando los cambios realizados en el esquema de base de datos (`db_schema.sql`).

## 1. Gestión de Sesión y Estado del Gimnasio (Tenant)
Actualmente, la aplicación asume un único entorno. Ahora es necesario que toda la aplicación sepa sobre qué `gimnasio_id` (Tenant) está operando el usuario.

**Implementación sugerida:**
- **Zustand Store / React Context:** Crear un estado global (ej. `useGymStore`) que cargue y almacene los datos del gimnasio actual (nombre, configuración) al iniciar sesión.
- **Middleware (Next.js):** El middleware debe asegurar que el usuario logueado tenga el `gimnasio_id` configurado en el JWT (`app_metadata`).
- **Verificación en UI:** Mostrar siempre el nombre del gimnasio en el Sidebar o Topbar.

## 2. Onboarding y Registro Público (`/signup`)
Se debe crear un flujo de registro para que nuevos dueños de gimnasios puedan darse de alta de forma autónoma.

**Flujo:**
1. **Ruta:** `/signup/page.tsx`
2. **Formulario:** Pedir Nombre del Gimnasio, Nombre del Propietario, Email, y Contraseña.
3. **Backend RPC / Edge Function:** Al enviar el formulario, el cliente no puede insertar directamente en `gimnasios` ni crear usuarios con roles especiales sin privilegios. Se debe invocar una función de Supabase (PostgreSQL RPC o Edge Function) que realice lo siguiente transaccionalmente:
   - Crear el registro en la tabla `gimnasios`.
   - Crear el usuario en Supabase Auth (`auth.users`).
   - Insertar el usuario en la tabla `empleados` vinculado al `gimnasio_id` recién creado, con el rol `superadmin` o `admin`.
   - Actualizar el JWT (User Metadata) en Supabase Auth para inyectar `gimnasio_id` y `rol` en el `app_metadata` para que el RLS funcione inmediatamente.

## 3. Panel Superadmin (Gestor de SaaS)
Para administrar a los clientes (gimnasios), el dueño de GymControl necesita un panel especial.

- **Ruta:** `/backoffice` o un subdominio.
- **Vistas:**
  - Lista de Gimnasios (Clientes).
  - Estado de suscripción (`activa`, `suspendida`, `prueba`).
  - Métricas globales de uso (Cantidad total de socios por gimnasio).
- **Control de Acceso:** Crear un rol específico `system_admin` en la base de datos (o usar un email específico) que tenga permisos en RLS para acceder y modificar cualquier gimnasio.

## 4. Refactorización de Operaciones del Frontend
- **No es necesario refactorizar los INSERTs / SELECTs:** Gracias a la implementación de JWT Claims y RLS, las consultas a la base de datos que ya existen en el frontend seguirán funcionando sin enviar explícitamente el `gimnasio_id`. Supabase filtrará los `SELECT` y los triggers (`set_tenant_id()`) inyectarán el `gimnasio_id` en los `INSERT`.
- **Excepción - Unicidad por Tenant:** El Frontend debe manejar que ahora pueden existir DNIs duplicados globalmente, pero **no** dentro del mismo `gimnasio_id`. Los mensajes de error de Supabase (cuando se viola el índice único `idx_socios_gimnasio_dni`) deben capturarse para mostrar un mensaje amigable al usuario (ej. "Este DNI ya está registrado en tu gimnasio").

## 5. Pruebas y Validación (Checklist)
Antes del despliegue:
- [ ] Registrar 2 gimnasios de prueba (Tenant A y Tenant B).
- [ ] Crear 1 empleado y 1 socio en Tenant A.
- [ ] Iniciar sesión como empleado de Tenant B y verificar que **NO** se puede ver al empleado ni al socio de Tenant A.
- [ ] Iniciar sesión como empleado de Tenant B, crear un socio, y comprobar en la base de datos (como superadmin) que el socio nuevo tiene el `gimnasio_id` del Tenant B.
- [ ] Comprobar que el trigger de inserción automática funciona para todas las tablas: `asistencias`, `membresias`, `pagos`, `planes`, `configuraciones`.

## 6. Próximos Pasos (Fase 2 del SaaS)
- **Facturación / Pagos:** Integrar pasarela de pagos (Stripe, MercadoPago) para cobrar la suscripción mensual de GymControl a cada gimnasio.
- **Configuración Personalizada:** Permitir a cada gimnasio subir su propio logo y colores en la tabla de `configuraciones`.
