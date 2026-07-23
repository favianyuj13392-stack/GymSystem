-- =========================================================================
-- SAAS MULTI-TENANT ARCHITECTURE
-- =========================================================================

-- Crear la tabla 'gimnasios' (tenants)
CREATE TABLE IF NOT EXISTS gimnasios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  estado_suscripcion TEXT NOT NULL DEFAULT 'activa' CHECK (estado_suscripcion IN ('activa', 'suspendida', 'prueba')),
  creado_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en 'gimnasios'
ALTER TABLE gimnasios ENABLE ROW LEVEL SECURITY;

-- Crear la tabla 'empleados' para gestionar los roles y datos de los trabajadores del gimnasio.
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gimnasio_id UUID NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('superadmin', 'admin', 'empleado')),
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

-- Creamos una función de utilidad para obtener el gimnasio_id del usuario logueado desde su JWT
CREATE OR REPLACE FUNCTION get_jwt_gimnasio_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'gimnasio_id')::UUID;
$$;

-- Política para Gimnasios
-- Solo superadmin puede ver/modificar todos. Administradores/empleados ven el suyo.
CREATE POLICY "Usuarios ven su propio gimnasio"
ON gimnasios FOR SELECT TO authenticated
USING (id = get_jwt_gimnasio_id());

-- Políticas para Empleados
CREATE POLICY "Empleados ven empleados de su gimnasio"
ON empleados FOR SELECT TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id());

CREATE POLICY "Admin puede insertar empleados en su gimnasio"
ON empleados FOR INSERT TO authenticated
WITH CHECK (
  gimnasio_id = get_jwt_gimnasio_id()
  AND (auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'superadmin')
);

CREATE POLICY "Admin puede actualizar empleados en su gimnasio"
ON empleados FOR UPDATE TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id() AND (auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'superadmin'))
WITH CHECK (gimnasio_id = get_jwt_gimnasio_id() AND (auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'superadmin'));

CREATE POLICY "Admin puede borrar empleados en su gimnasio"
ON empleados FOR DELETE TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id() AND (auth.jwt() -> 'app_metadata' ->> 'rol') IN ('admin', 'superadmin'));


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
CREATE POLICY "Aislamiento SaaS socios" ON socios FOR ALL TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id()) WITH CHECK (gimnasio_id = get_jwt_gimnasio_id());

-- ASISTENCIAS
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS asistencias" ON asistencias FOR ALL TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id()) WITH CHECK (gimnasio_id = get_jwt_gimnasio_id());

-- MEMBRESIAS
ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS membresias" ON membresias FOR ALL TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id()) WITH CHECK (gimnasio_id = get_jwt_gimnasio_id());

-- PAGOS
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS pagos" ON pagos FOR ALL TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id()) WITH CHECK (gimnasio_id = get_jwt_gimnasio_id());

-- PLANES
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS planes" ON planes FOR ALL TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id()) WITH CHECK (gimnasio_id = get_jwt_gimnasio_id());

-- CONFIGURACIONES
ALTER TABLE configuraciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento SaaS configuraciones" ON configuraciones FOR ALL TO authenticated
USING (gimnasio_id = get_jwt_gimnasio_id()) WITH CHECK (gimnasio_id = get_jwt_gimnasio_id());


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
    -- 1. Crear el nuevo gimnasio
    INSERT INTO public.gimnasios (nombre, estado_suscripcion)
    VALUES (gimnasio_nombre, 'prueba')
    RETURNING id INTO nuevo_gimnasio_id;

    -- 2. Crear el empleado asociado con rol superadmin
    INSERT INTO public.empleados (id, gimnasio_id, nombre, email, rol)
    VALUES (NEW.id, nuevo_gimnasio_id, COALESCE(usuario_nombre, 'Admin'), NEW.email, 'superadmin');

    -- 3. Actualizar el app_metadata del usuario para inyectar gimnasio_id y rol
    -- IMPORTANTE: Supabase Auth utiliza app_metadata en el JWT para el RLS
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{gimnasio_id}',
        to_jsonb(nuevo_gimnasio_id)
      ),
      '{rol}',
      '"superadmin"'
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


