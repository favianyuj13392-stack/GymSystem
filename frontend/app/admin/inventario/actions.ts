"use server"

import { supabaseServer } from '@/lib/supabaseServer';
import { createClient } from '@/utils/supabase/server';
import { ProductoInventario } from '@/types/inventario';

async function obtenerGymIdActual() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const gymId = (user.app_metadata as any)?.gimnasio_id;
      if (gymId) return gymId;
    }
  } catch (e) {}
  return '00000000-0000-0000-0000-000000000001';
}

export async function obtenerProductosInventario(): Promise<ProductoInventario[]> {
  try {
    const gymId = await obtenerGymIdActual();

    // 1. Intentar consultar en la tabla relacional real 'productos'
    const { data, error } = await supabaseServer
      .from('productos')
      .select('id, nombre, precio, stock, categoria')
      .eq('gimnasio_id', gymId)
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (!error && data) {
      return data.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        precio: Number(item.precio),
        stock: Number(item.stock),
        categoria: item.categoria || 'General',
      }));
    }

    // 2. Fallback a la tabla configuraciones si productos no existiera aún en el esquema remoto
    const { data: productosRow } = await supabaseServer
      .from('configuraciones')
      .select('valor')
      .eq('clave', 'productos_venta')
      .maybeSingle();

    if (productosRow?.valor) {
      try {
        let parsed = JSON.parse(productosRow.valor);
        while (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
          parsed = parsed.flat();
        }
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            id: item.id || String(Math.random()),
            nombre: item.nombre || 'Producto sin nombre',
            precio: Number(item.precio) || 0,
            stock: typeof item.stock === 'number' ? item.stock : 50,
            categoria: item.categoria || 'General',
          }));
        }
      } catch (e) {}
    }

    return [];
  } catch (error) {
    console.error('Error obteniendo productos de inventario:', error);
    return [];
  }
}

export async function guardarListaProductos(productos: ProductoInventario[]) {
  try {
    const gymId = await obtenerGymIdActual();
    let flatList = Array.isArray(productos) ? productos.flat(Infinity) : [];
    flatList = flatList.filter((item: any) => item && typeof item === 'object' && !Array.isArray(item) && item.nombre);

    // Persistir cada producto en la tabla relacional productos
    for (const prod of flatList) {
      const payload = {
        gimnasio_id: gymId,
        nombre: prod.nombre.trim(),
        precio: Number(prod.precio) || 0,
        stock: Math.max(0, Number(prod.stock) || 0),
        categoria: prod.categoria || 'General',
        activo: true,
      };

      // Si el id es un UUID válido, intentar actualizar o insertar
      const isUuid = typeof prod.id === 'string' && prod.id.length === 36 && prod.id.includes('-');

      if (isUuid) {
        const { error: updateErr } = await supabaseServer
          .from('productos')
          .update(payload)
          .eq('id', prod.id)
          .eq('gimnasio_id', gymId);

        if (updateErr) {
          await supabaseServer.from('productos').insert({ ...payload, id: prod.id });
        }
      } else {
        await supabaseServer.from('productos').insert(payload);
      }
    }

    // Sincronizar también en la tabla configuraciones por retrocompatibilidad
    try {
      const jsonString = JSON.stringify(flatList);
      const { data: existente } = await supabaseServer
        .from('configuraciones')
        .select('id')
        .eq('clave', 'productos_venta')
        .maybeSingle();

      if (existente) {
        await supabaseServer.from('configuraciones').update({ valor: jsonString }).eq('id', existente.id);
      } else {
        await supabaseServer.from('configuraciones').insert({ clave: 'productos_venta', valor: jsonString });
      }
    } catch (e) {}

    return { success: true };
  } catch (error: any) {
    console.error('Error guardando lista de productos:', error);
    return { success: false, error: error.message || 'Error al guardar la lista de productos.' };
  }
}
