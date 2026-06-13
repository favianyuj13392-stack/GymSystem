-- Crear la tabla 'empleados' para gestionar los roles y datos de los trabajadores del gimnasio.
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'empleado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en 'empleados'
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

-- Política para permitir a cualquier usuario autenticado leer los empleados (por ejemplo, para consultar su propio rol)
CREATE POLICY "Allow authenticated users to read roles" 
ON empleados FOR SELECT TO authenticated USING (true);

-- Política para permitir a los administradores tener acceso a operaciones de escritura de forma segura (sin recursión en SELECT)
CREATE POLICY "Allow admins to insert empleados" 
ON empleados FOR INSERT TO authenticated 
WITH CHECK (
  (SELECT rol FROM empleados WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Allow admins to update empleados" 
ON empleados FOR UPDATE TO authenticated 
USING (
  (SELECT rol FROM empleados WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT rol FROM empleados WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Allow admins to delete empleados" 
ON empleados FOR DELETE TO authenticated 
USING (
  (SELECT rol FROM empleados WHERE id = auth.uid()) = 'admin'
);

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
CREATE INDEX IF NOT EXISTS idx_socios_dni 
ON socios (dni);

CREATE INDEX IF NOT EXISTS idx_socios_nombre_lower 
ON socios (lower(nombre));

-- 5. Configuración de Seguridad en Cascadas
-- Se recomienda revisar que todas las Foreign Keys tengan 'ON DELETE CASCADE' o 'SET NULL'
-- para evitar bloqueos transaccionales huérfanos al borrar registros.

