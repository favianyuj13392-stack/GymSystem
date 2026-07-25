-- =========================================================================
-- ESQUEMA COMPLETO Y NATIVO MULTI-TENANT PARA GYMSYSTEM SAAS
-- =========================================================================

-- 1. TABLA DE GIMNASIOS (TENANTS)
CREATE TABLE IF NOT EXISTS public.gimnasios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE,
  email_contacto TEXT,
  telefono_contacto TEXT,
  logo_url TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'prueba')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Seed de gimnasio demo inicial si no existe
INSERT INTO public.gimnasios (id, nombre, slug, estado)
VALUES ('00000000-0000-0000-0000-000000000001', 'Gimnasio Principal Demo', 'gym-demo', 'activo')
ON CONFLICT (id) DO NOTHING;

-- 2. TABLA DE EMPLEADOS / USUARIOS DEL GIMNASIO
CREATE TABLE IF NOT EXISTS public.empleados (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gimnasio_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('superadmin', 'admin', 'empleado')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(gimnasio_id, email)
);

-- 3. TABLA DE PLANES DE MEMBRESÍA DEL GIMNASIO
CREATE TABLE IF NOT EXISTS public.planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  duracion_meses INT NOT NULL DEFAULT 1 CHECK (duracion_meses > 0),
  limite_accesos INT,
  hora_inicio TIME,
  hora_fin TIME,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABLA DE SOCIOS (CLIENTES DEL GIMNASIO)
CREATE TABLE IF NOT EXISTS public.socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT,
  dni TEXT NOT NULL,
  telefono TEXT,
  fecha_nacimiento DATE,
  foto_url TEXT,
  codigo_qr TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'vencido', 'baja')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(gimnasio_id, dni),
  UNIQUE(gimnasio_id, codigo_qr)
);

-- 5. TABLA DE MEMBRESÍAS ASIGNADAS
CREATE TABLE IF NOT EXISTS public.membresias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  socio_id UUID NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.planes(id) ON DELETE RESTRICT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'vencido', 'reemplazado', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. TABLA DE ASISTENCIAS / CONTROL DE ACCESO
CREATE TABLE IF NOT EXISTS public.asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  socio_id UUID NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  registrado_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. TABLA DE PRODUCTOS E INVENTARIO
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  categoria TEXT DEFAULT 'General',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. TABLA DE COBROS Y PAGOS
CREATE TABLE IF NOT EXISTS public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gimnasio_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  socio_id UUID REFERENCES public.socios(id) ON DELETE SET NULL,
  membresia_id UUID REFERENCES public.membresias(id) ON DELETE SET NULL,
  producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('Efectivo', 'QR', 'Transferencia', 'Tarjeta')),
  concepto TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Plan', 'Producto', 'Otros')),
  fecha_pago TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =========================================================================
-- ÍNDICES DE ALTO RENDIMIENTO POR TENANT
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_empleados_gimnasio ON public.empleados(gimnasio_id);
CREATE INDEX IF NOT EXISTS idx_socios_gimnasio_dni ON public.socios(gimnasio_id, dni);
CREATE INDEX IF NOT EXISTS idx_socios_gimnasio_qr ON public.socios(gimnasio_id, codigo_qr);
CREATE INDEX IF NOT EXISTS idx_membresias_socio ON public.membresias(gimnasio_id, socio_id, estado);
CREATE INDEX IF NOT EXISTS idx_asistencias_socio_fecha ON public.asistencias(gimnasio_id, socio_id, registrado_at DESC);
CREATE INDEX IF NOT EXISTS idx_productos_gimnasio ON public.productos(gimnasio_id, activo);
CREATE INDEX IF NOT EXISTS idx_pagos_gimnasio_fecha ON public.pagos(gimnasio_id, fecha_pago DESC);

-- =========================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =========================================================================
ALTER TABLE public.gimnasios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membresias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener el gimnasio_id desde el JWT
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::json -> 'app_metadata' ->> 'gimnasio_id', '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$ LANGUAGE sql STABLE;

-- Políticas de aislamiento SaaS para cada tabla
DROP POLICY IF EXISTS "Tenant isolation for empleados" ON public.empleados;
CREATE POLICY "Tenant isolation for empleados" ON public.empleados FOR ALL TO authenticated USING (gimnasio_id = public.get_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for planes" ON public.planes;
CREATE POLICY "Tenant isolation for planes" ON public.planes FOR ALL TO authenticated USING (gimnasio_id = public.get_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for socios" ON public.socios;
CREATE POLICY "Tenant isolation for socios" ON public.socios FOR ALL TO authenticated USING (gimnasio_id = public.get_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for membresias" ON public.membresias;
CREATE POLICY "Tenant isolation for membresias" ON public.membresias FOR ALL TO authenticated USING (gimnasio_id = public.get_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for asistencias" ON public.asistencias;
CREATE POLICY "Tenant isolation for asistencias" ON public.asistencias FOR ALL TO authenticated USING (gimnasio_id = public.get_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for productos" ON public.productos;
CREATE POLICY "Tenant isolation for productos" ON public.productos FOR ALL TO authenticated USING (gimnasio_id = public.get_tenant_id());

DROP POLICY IF EXISTS "Tenant isolation for pagos" ON public.pagos;
CREATE POLICY "Tenant isolation for pagos" ON public.pagos FOR ALL TO authenticated USING (gimnasio_id = public.get_tenant_id());
