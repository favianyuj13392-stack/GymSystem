"use server"

import { supabaseServer } from '@/lib/supabaseServer';
import { ProductoInventario } from '@/types/inventario';
import { readConfigFallback, writeConfigFallback } from '@/lib/configStore';

export async function obtenerProductosInventario() {
  try {
    const { data: productosRow, error } = await supabaseServer
      .from('configuraciones')
      .select('*')
      .eq('clave', 'productos_venta')
      .maybeSingle();

    let rawValue = productosRow?.valor;

    if (error || !rawValue) {
      if (error?.message?.includes('configuraciones')) {
        console.warn('Tabla configuraciones no encontrada en Supabase, leyendo de respaldo local.');
        rawValue = readConfigFallback('productos_venta');
      }
    }

    if (!rawValue) {
      return [];
    }

    try {
      let parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      
      // Desempaquetar matrices anidadas
      while (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
        parsed = parsed.flat();
      }

      if (Array.isArray(parsed)) {
        return parsed
          .filter((item: any) => item && typeof item === 'object' && !Array.isArray(item))
          .map((item: any) => ({
            id: item.id || String(Math.random()),
            nombre: item.nombre || 'Producto sin nombre',
            precio: Number(item.precio) || 0,
            stock: typeof item.stock === 'number' ? item.stock : 50,
            categoria: item.categoria || 'General',
          })) as ProductoInventario[];
      }
    } catch (e) {
      console.error('Error parseando productos_venta:', e);
    }
    return [];
  } catch (error) {
    console.error('Error obteniendo productos de inventario:', error);
    const fallback = readConfigFallback('productos_venta');
    if (fallback) {
      return Array.isArray(fallback) ? fallback : [];
    }
    return [];
  }
}

export async function guardarListaProductos(productos: ProductoInventario[]) {
  try {
    // Aplanar y limpiar el arreglo para garantizar que sea un arreglo 1D sin anidamiento
    let flatList = Array.isArray(productos) ? productos.flat(Infinity) : [];
    flatList = flatList.filter((item: any) => item && typeof item === 'object' && !Array.isArray(item) && item.nombre);

    const jsonString = JSON.stringify(flatList);

    // Intentar en Supabase primero
    const { data: existente, error: selectErr } = await supabaseServer
      .from('configuraciones')
      .select('id')
      .eq('clave', 'productos_venta')
      .maybeSingle();

    if (selectErr && selectErr.message?.includes('configuraciones')) {
      console.warn('Tabla configuraciones no existe en Supabase, guardando en respaldo local.');
      writeConfigFallback('productos_venta', jsonString);
      return { success: true };
    }

    let saveError = null;

    if (existente) {
      const { error } = await supabaseServer
        .from('configuraciones')
        .update({ valor: jsonString })
        .eq('id', existente.id);
      saveError = error;
    } else {
      const { error } = await supabaseServer
        .from('configuraciones')
        .insert({
          clave: 'productos_venta',
          valor: jsonString,
          descripcion: 'Catálogo e inventario de productos de venta',
        });
      saveError = error;
    }

    if (saveError) {
      console.warn('Error guardando en Supabase, usando respaldo local:', saveError);
      writeConfigFallback('productos_venta', jsonString);
      return { success: true };
    }

    // Mantener sincronizado el respaldo local también
    writeConfigFallback('productos_venta', jsonString);
    return { success: true };
  } catch (error: any) {
    console.error('Error en guardarListaProductos, aplicando respaldo local:', error);
    const flatList = Array.isArray(productos) ? productos.flat(Infinity) : [];
    writeConfigFallback('productos_venta', JSON.stringify(flatList));
    return { success: true };
  }
}
