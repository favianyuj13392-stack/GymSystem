-- =========================================================================
-- SAAS MULTI-TENANT ARCHITECTURE
-- =========================================================================

-- Crear la tabla 'gimnasios' (tenants)
CREATE TABLE IF NOT EXISTS gimnasios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  suscripcion_activa_id UUID, -- Se agregará referencia a la tabla suscripciones más abajo
  activo_hasta DATE,
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en 'gimnasios'
ALTER TABLE gimnasios ENABLE ROW LEVEL SECURITY;

-- Crear tabla 'suscripciones'
CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'expirada', 'cancelada')),
  monto_pagado DECIMAL(10, 2) NOT NULL,
  moneda TEXT DEFAULT 'ARS',
  meses_pagados INTEGER NOT NULL DEFAULT 1,
  creado_por_admin UUID NOT NULL REFERENCES auth.users(id),
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  actualizado_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_gimnasio_id ON suscripciones(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_fecha_fin ON suscripciones(fecha_fin);

ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin inserta y actualiza suscripciones" ON suscripciones FOR ALL TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'system_admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'system_admin');

CREATE POLICY "Usuarios ven sus propias suscripciones" ON suscripciones FOR SELECT TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id());

-- Agregamos la Foreign Key a gimnasios ahora que la tabla suscripciones existe
ALTER TABLE gimnasios ADD CONSTRAINT fk_suscripcion_activa FOREIGN KEY (suscripcion_activa_id) REFERENCES suscripciones(id) ON DELETE SET NULL;


-- Crear tabla 'eventos_suscripcion'
CREATE TABLE IF NOT EXISTS eventos_suscripcion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('pago_registrado', 'activado', 'desactivado', 'expirado', 'renovado')),
  descripcion TEXT,
  usuario_admin UUID REFERENCES auth.users(id),
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eventos_suscripcion_gimnasio_id ON eventos_suscripcion(gimnasio_id);

ALTER TABLE eventos_suscripcion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin inserta y actualiza eventos" ON eventos_suscripcion FOR ALL TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'system_admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'system_admin');

CREATE POLICY "Usuarios ven sus propios eventos" ON eventos_suscripcion FOR SELECT TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id());

-- Crear la tabla 'empleados' para gestionar los roles y datos de los trabajadores del gimnasio.
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('system_admin', 'superadmin', 'admin', 'empleado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(gimnasio_id, email) -- El email es unico por gimnasio
);

-- Para evitar bloqueos, creamos un índice por gimnasio_id en empleados
CREATE INDEX IF NOT EXISTS idx_empleados_gimnasio_id ON empleados(gimnasio_id);

-- Habilitar Row Level Security (RLS) en 'empleados'
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

-- Política para permitir a cualquier usuario autenticado leer los empleados (por ejemplo, para consultar su propio rol)
-- =========================================================================
-- MULTI-TENANT RLS POLICIES USING JWT CLAIMS
-- =========================================================================

-- Función para verificar si un gimnasio tiene la suscripción activa
-- Función para verificar si un gimnasio tiene la suscripción activa (OPTIZIMIZADA)
CREATE OR REPLACE FUNCTION is_gimnasio_activo(p_gimnasio_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM gimnasios
    WHERE id = p_gimnasio_id
      AND suscripcion_activa_id IS NOT NULL
      AND activo_hasta >= CURRENT_DATE
  );
$$;

-- Función que actualiza el estado del gimnasio (para mantener la desnormalización)
CREATE OR REPLACE FUNCTION actualizar_estado_gimnasio()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gimnasios
  SET
    suscripcion_activa_id = NEW.id,
    activo_hasta = NEW.fecha_fin
  WHERE id = NEW.gimnasio_id AND NEW.estado = 'activa';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener el gimnasio sincronizado al cambiar suscripciones
DROP TRIGGER IF EXISTS trg_actualizar_estado_gimnasio ON suscripciones;
CREATE TRIGGER trg_actualizar_estado_gimnasio
  AFTER INSERT OR UPDATE OF estado, fecha_fin ON suscripciones
  FOR EACH ROW EXECUTE PROCEDURE actualizar_estado_gimnasio();

-- Función que marca suscripciones como expiradas (para el cron job)
CREATE OR REPLACE FUNCTION expirar_suscripciones_vencidas()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_suscripcion RECORD;
BEGIN
  -- Buscar todas las suscripciones que vencieron hoy o antes
  FOR v_suscripcion IN
    SELECT id, gimnasio_id
    FROM suscripciones
    WHERE estado = 'activa'
      AND fecha_fin < CURRENT_DATE
  LOOP
    -- Marcar como expirada
    UPDATE suscripciones
    SET estado = 'expirada'
    WHERE id = v_suscripcion.id;

    -- Registrar evento
    INSERT INTO eventos_suscripcion
      (gimnasio_id, tipo_evento, descripcion)
    VALUES
      (v_suscripcion.gimnasio_id, 'expirado',
       'Suscripción expirada automáticamente');
  END LOOP;
END;
$$;

-- Configurar pg_cron para correr la expiracion (se comentan para evitar error local en psql, deben correrse en supabase sql editor directamente)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('expirar-suscripciones', '1 0 * * *', 'SELECT expirar_suscripciones_vencidas()');


-- Creamos una función de utilidad para obtener el gimnasio_id del usuario logueado desde su JWT
CREATE OR REPLACE FUNCTION get_jwt_gimnasio_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'gimnasio_id')::UUID;
$$;

-- Política para Gimnasios
-- Solo system_admin puede ver/modificar todos. Administradores/empleados ven el suyo.
DROP POLICY IF EXISTS "Usuarios ven su propio gimnasio" ON gimnasios;
CREATE POLICY "Usuarios ven su propio gimnasio o superadmin ve todos"
ON gimnasios FOR SELECT TO authenticated
USING (id = get_jwt_gimnasio_id() OR (auth.jwt() -> 'app_metadata' ->> 'rol') = 'system_admin');

CREATE POLICY "Superadmin actualiza gimnasios"
ON gimnasios FOR UPDATE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'system_admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'rol') = 'system_admin');

-- Políticas para Empleados
DROP POLICY IF EXISTS "Empleados ven empleados de su gimnasio" ON empleados;
CREATE POLICY "Empleados acceso por suscripción activa"
ON empleados FOR SELECT TO authenticated
USING (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
);

CREATE POLICY "Admin puede insertar empleados en su gimnasio"
ON empleados FOR INSERT TO authenticated
WITH CHECK (
  gimnasio_id = get_jwt_gimnasio_id()
  AND (SELECT rol FROM empleados WHERE id = auth.uid()) IN ('admin', 'superadmin')
);

CREATE POLICY "Admin puede actualizar empleados en su gimnasio"
ON empleados FOR UPDATE TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id() AND (SELECT rol FROM empleados WHERE id = auth.uid()) IN ('admin', 'superadmin'))
WITH CHECK (gimnasio_id = get_jwt_gimnasio_id() AND (SELECT rol FROM empleados WHERE id = auth.uid()) IN ('admin', 'superadmin'));

CREATE POLICY "Admin puede borrar empleados en su gimnasio"
ON empleados FOR DELETE TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id() AND (SELECT rol FROM empleados WHERE id = auth.uid()) IN ('admin', 'superadmin'));


-- Políticas genéricas de aislamiento SaaS para las tablas operativas:
-- Agregar columna 'metodo_pago' a la tabla 'pagos' para soportar el desglose de métodos de pago
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS metodo_pago TEXT CHECK (metodo_pago IN ('Efectivo', 'Transferencia')) DEFAULT 'Efectivo';

-- =========================================================================
-- OPTIMIZACIONES DE RENDIMIENTO Y ESTABILIDAD PARA SUPABASE (BOLSILLO & ESCALA)
-- =========================================================================
-- Estas optimizaciones garantizan que el sistema no sufra "cold starts" o caídas
-- por tablas sobrecargadas al escalar el gimnasio. Ejecutar en el SQL Editor:

-- 1. Índices para Asistencias (Evita lecturas secuenciales costosas al marcar entradas/salidas)
CREATE INDEX IF NOT EXISTS idx_asistencias_socio_tipo_fecha 
ON asistencias (socio_id, tipo, registrado_at DESC);

CREATE INDEX IF NOT EXISTS idx_asistencias_registrado_at 
ON asistencias (registrado_at DESC);

-- 2. Índices para Membresías (Agiliza el cálculo diario de vencimientos y estados activos)
CREATE INDEX IF NOT EXISTS idx_membresias_estado_fecha_fin 
ON membresias (estado, fecha_fin DESC);

CREATE INDEX IF NOT EXISTS idx_membresias_socio_id 
ON membresias (socio_id);

-- 3. Índices para Pagos (Optimiza las métricas de ingresos mensuales y análisis de caja)
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago 
ON pagos (fecha_pago DESC);

CREATE INDEX IF NOT EXISTS idx_pagos_membresia_id 
ON pagos (membresia_id);

-- 4. Índices para Socios (Buscador rápido por Nombre y DNI)
-- =========================================================================
-- MIGRACIÓN MULTI-TENANT PARA OTRAS TABLAS
-- =========================================================================

-- Tabla de socios
ALTER TABLE socios ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES gimnasios(id) ON DELETE CASCADE;
-- Update socios to use (gimnasio_id, dni) for uniqueness if they had a simple UNIQUE constraint on dni.
-- (This step might require dropping an old UNIQUE constraint manually if one exists, but for the index:)
DROP INDEX IF EXISTS idx_socios_dni;
CREATE UNIQUE INDEX IF NOT EXISTS idx_socios_gimnasio_dni ON socios(gimnasio_id, dni);
CREATE INDEX IF NOT EXISTS idx_socios_gimnasio_id ON socios(gimnasio_id);

-- Tabla de asistencias
ALTER TABLE asistencias ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES gimnasios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_asistencias_gimnasio_id ON asistencias(gimnasio_id);

-- Tabla de membresias
ALTER TABLE membresias ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES gimnasios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_membresias_gimnasio_id ON membresias(gimnasio_id);

-- Tabla de pagos
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES gimnasios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_pagos_gimnasio_id ON pagos(gimnasio_id);

-- Tabla de planes
ALTER TABLE planes ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES gimnasios(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_planes_gimnasio_id ON planes(gimnasio_id);

-- Tabla de configuraciones globales -> Ahora por gimnasio
ALTER TABLE configuraciones ADD COLUMN IF NOT EXISTS gimnasio_id UUID REFERENCES gimnasios(id) ON DELETE CASCADE;
ALTER TABLE configuraciones DROP CONSTRAINT IF EXISTS configuraciones_clave_key;
ALTER TABLE configuraciones ADD CONSTRAINT configuraciones_gimnasio_clave_key UNIQUE(gimnasio_id, clave);
CREATE INDEX IF NOT EXISTS idx_configuraciones_gimnasio_id ON configuraciones(gimnasio_id);


-- 4. Índices para Socios (Buscador rápido por Nombre)

CREATE INDEX IF NOT EXISTS idx_socios_nombre_lower 
ON socios (lower(nombre));

-- =========================================================================
-- MIGRACIÓN MULTI-TENANT PARA OTRAS TABLAS - POLICIES Y TRIGGERS
-- =========================================================================

-- Políticas genéricas de aislamiento SaaS para las tablas operativas:
-- SOCIOS
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE POLICY "Aislamiento SaaS con validación suscripción" ON socios FOR ALL TO authenticated
USING (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
)
WITH CHECK (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
);

-- ASISTENCIAS
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS asistencias" ON asistencias FOR ALL TO authenticated
USING (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
)
WITH CHECK (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
);

-- MEMBRESIAS
ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS membresias" ON membresias FOR ALL TO authenticated
USING (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
)
WITH CHECK (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
);

-- PAGOS
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS pagos" ON pagos FOR ALL TO authenticated
USING (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
)
WITH CHECK (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
);

-- PLANES
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS planes" ON planes FOR ALL TO authenticated
USING (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
)
WITH CHECK (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
);

-- CONFIGURACIONES
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS configuraciones" ON configuraciones FOR ALL TO authenticated
USING (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
)
WITH CHECK (
  gimnasio_id = get_jwt_gimnasio_id()
  AND is_gimnasio_activo(gimnasio_id)
);


-- =========================================================================
-- AUTOMATIZACION: TRIGGER PARA INYECTAR GIMNASIO_ID
-- =========================================================================
-- Este trigger se asegura de que cualquier fila nueva reciba automáticamente el gimnasio_id del usuario que la crea.
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el insert no incluye gimnasio_id, lo toma del JWT
  IF NEW.gimnasio_id IS NULL THEN
    NEW.gimnasio_id := get_jwt_gimnasio_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_tenant_id_socios BEFORE INSERT ON socios FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
CREATE TRIGGER trg_set_tenant_id_asistencias BEFORE INSERT ON asistencias FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
CREATE TRIGGER trg_set_tenant_id_membresias BEFORE INSERT ON membresias FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
CREATE TRIGGER trg_set_tenant_id_pagos BEFORE INSERT ON pagos FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
CREATE TRIGGER trg_set_tenant_id_planes BEFORE INSERT ON planes FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
CREATE TRIGGER trg_set_tenant_id_configuraciones BEFORE INSERT ON configuraciones FOR EACH ROW EXECUTE FUNCTION set_tenant_id();

-- =========================================================================
-- FLUJO DE REGISTRO / ONBOARDING (NUEVOS TENANTS)
-- =========================================================================
-- Función para ejecutarse cuando un usuario se registra vía Auth de Supabase (Signup)
CREATE OR REPLACE FUNCTION public.handle_new_user_tenant()
RETURNS trigger AS $$
DECLARE
  nuevo_gimnasio_id UUID;
  gimnasio_nombre TEXT;
  usuario_nombre TEXT;
BEGIN
  -- Extraer datos del user_metadata (enviados desde el frontend durante el signup)
  gimnasio_nombre := NEW.raw_user_meta_data->>'nombre_gimnasio';
  usuario_nombre := NEW.raw_user_meta_data->>'full_name';

  -- Solo proceder si es un registro "Dueño de Gimnasio" (viene con nombre_gimnasio)
  IF gimnasio_nombre IS NOT NULL THEN
    -- Crear nuevo gimnasio SIN suscripción activa
    INSERT INTO public.gimnasios (nombre)
    VALUES (gimnasio_nombre)
    RETURNING id INTO nuevo_gimnasio_id;

    -- Crear empleado (superadmin del gimnasio)
    INSERT INTO public.empleados (id, gimnasio_id, nombre, email, rol)
    VALUES (NEW.id, nuevo_gimnasio_id, COALESCE(usuario_nombre, 'Admin'),
            NEW.email, 'superadmin');

    -- NO inyectar gimnasio_id en JWT aún
    -- El acceso solo se habilita cuando superadmin registra el primer pago
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{estado}',
      '"pendiente_activacion"'
    )
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se dispara después de crear un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_tenant ON auth.users;
CREATE TRIGGER on_auth_user_created_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_tenant();


-- =========================================================================
-- REGISTRO DE PAGOS (RPC PARA BACKOFFICE)
-- =========================================================================
CREATE OR REPLACE FUNCTION registrar_pago_suscripcion(
  p_gimnasio_id UUID,
  p_monto DECIMAL,
  p_meses INT,
  p_notas TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub_id UUID;
  v_fecha_fin DATE;
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  v_role := (auth.jwt() -> 'app_metadata' ->> 'rol');

  -- Validar que el usuario sea el superadmin global
  IF v_user_id IS NULL OR v_role != 'system_admin' THEN
    RAISE EXCEPTION 'No tienes permiso para registrar pagos (se requiere system_admin)';
  END IF;

  -- Validaciones de datos
  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a 0';
  END IF;

  IF p_meses <= 0 OR p_meses > 36 THEN
    RAISE EXCEPTION 'Los meses deben estar entre 1 y 36';
  END IF;

  -- Validar existencia del gimnasio y que no tenga ya una suscripción activa
  IF NOT EXISTS (SELECT 1 FROM gimnasios WHERE id = p_gimnasio_id) THEN
    RAISE EXCEPTION 'Gimnasio no encontrado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM suscripciones
    WHERE gimnasio_id = p_gimnasio_id AND estado = 'activa' AND fecha_fin >= CURRENT_DATE
  ) THEN
    RAISE EXCEPTION 'Este gimnasio ya tiene una suscripción activa';
  END IF;

  -- Calcular fecha_fin en UTC
  v_fecha_fin := ((NOW() AT TIME ZONE 'UTC') + (p_meses || ' months')::INTERVAL)::DATE;

  -- Insertar suscripción (esto dispara el trigger actualizar_estado_gimnasio)
  INSERT INTO suscripciones (gimnasio_id, fecha_inicio, fecha_fin, estado, monto_pagado, meses_pagados, creado_por_admin, notas)
  VALUES (p_gimnasio_id, (NOW() AT TIME ZONE 'UTC')::DATE, v_fecha_fin, 'activa', p_monto, p_meses, v_user_id, p_notas)
  RETURNING id INTO v_sub_id;

  -- Registrar evento
  INSERT INTO eventos_suscripcion (gimnasio_id, tipo_evento, descripcion, usuario_admin)
  VALUES (p_gimnasio_id, 'pago_registrado', 'Pago de $' || p_monto || ' por ' || p_meses || ' mes(es)', v_user_id);

  RETURN jsonb_build_object('suscripcion_id', v_sub_id, 'fecha_fin', v_fecha_fin);
END;
$$;


-- =========================================================================
-- ACTIVACIÓN DE TENANTS: INYECTAR JWT TRAS EL PRIMER PAGO
-- =========================================================================
-- Cuando el superadmin registra el primer pago (o un pago nuevo) para un gimnasio,
-- buscamos a su dueño (empleado superadmin o admin) y le inyectamos el gimnasio_id en el JWT
CREATE OR REPLACE FUNCTION public.activar_tenant_despues_de_pago()
RETURNS trigger AS $$
DECLARE
  v_dueño_id UUID;
BEGIN
  IF NEW.estado = 'activa' THEN
    -- Buscar el ID de usuario del dueño del gimnasio (el que lo registró, típicamente rol superadmin o admin)
    SELECT id INTO v_dueño_id
    FROM public.empleados
    WHERE gimnasio_id = NEW.gimnasio_id
      AND rol IN ('superadmin', 'admin')
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND THEN
      -- Actualizar el app_metadata del usuario para inyectar gimnasio_id y cambiar el estado
      UPDATE auth.users
      SET raw_app_meta_data = jsonb_set(
        jsonb_set(
          COALESCE(raw_app_meta_data, '{}'::jsonb),
          '{gimnasio_id}',
          to_jsonb(NEW.gimnasio_id)
        ),
        '{estado}',
        '"activo"'
      )
      WHERE id = v_dueño_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_suscripcion_activada ON suscripciones;
CREATE TRIGGER on_suscripcion_activada
  AFTER INSERT OR UPDATE ON suscripciones
  FOR EACH ROW EXECUTE PROCEDURE public.activar_tenant_despues_de_pago();

-- 5. Configuración de Seguridad en Cascadas
-- Se recomienda revisar que todas las Foreign Keys tengan 'ON DELETE CASCADE' o 'SET NULL'
-- para evitar bloqueos transaccionales huérfanos al borrar registros.

-- =========================================================================
-- MIGRACIÓN DE CAMPOS: EMAIL, FECHA DE NACIMIENTO Y SEPARACIÓN DE APELLIDO
-- =========================================================================
-- Ejecutar en el SQL Editor para añadir los nuevos campos necesarios:

-- Modificaciones en la tabla 'socios'
ALTER TABLE socios ADD COLUMN IF NOT EXISTS apellido TEXT;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE socios ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;

-- Modificaciones en la tabla 'empleados'
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS apellido TEXT;

-- =========================================================================
-- CRUD DE PLANES, CLASIFICACIÓN DE PAGOS Y CONTROL DE ACCESOS
-- =========================================================================

-- Enriquecer la tabla de planes
ALTER TABLE planes ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE planes ADD COLUMN IF NOT EXISTS duracion_dias INTEGER DEFAULT 30;
ALTER TABLE planes ADD COLUMN IF NOT EXISTS limite_accesos INTEGER; -- NULL = ilimitado
ALTER TABLE planes ADD COLUMN IF NOT EXISTS hora_inicio TIME; -- NULL = sin restricción
ALTER TABLE planes ADD COLUMN IF NOT EXISTS hora_fin TIME; -- NULL = sin restricción
ALTER TABLE planes ADD COLUMN IF NOT EXISTS servicios_extras JSONB DEFAULT '[]'::jsonb;
ALTER TABLE planes ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Enriquecer y flexibilizar la tabla de pagos
ALTER TABLE pagos ALTER COLUMN socio_id DROP NOT NULL;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('Plan', 'Producto', 'Otros')) DEFAULT 'Plan';
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS concepto TEXT DEFAULT 'Membresía';
ALTER TABLE pagos ALTER COLUMN fecha_pago SET DEFAULT NOW();

-- =========================================================================
-- CONFIGURACIONES GLOBALES Y MULTIZONA
-- =========================================================================

-- Tabla de configuraciones globales
CREATE TABLE IF NOT EXISTS configuraciones (
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed de configuraciones iniciales
INSERT INTO configuraciones (clave, valor, descripcion)
VALUES 
  ('capacidad_maxima_simultanea', '100', 'Capacidad máxima simultánea recomendada para el gimnasio'),
  ('capacidad_zonas', '[{"nombre": "Sala Principal", "capacidad": 60}, {"nombre": "Clases Grupales", "capacidad": 25}, {"nombre": "Cardio", "capacidad": 15}]', 'Subdivisión de capacidad por zonas')
ON CONFLICT (clave) DO NOTHING;


