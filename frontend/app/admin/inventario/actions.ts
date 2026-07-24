"use server"

import { supabaseServer } from '@/lib/supabaseServer';
import { ProductoInventario } from '@/types/inventario';

export async function obtenerProductosInventario() {
  try {
    const { data: productosRow, error } = await supabaseServer
      .from('configuraciones')
      .select('*')
      .eq('clave', 'productos_venta')
      .maybeSingle();

    if (error || !productosRow || !productosRow.valor) {
      return [];
    }

    try {
      const parsed = JSON.parse(productosRow.valor);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
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
    return [];
  }
}

export async function guardarListaProductos(productos: ProductoInventario[]) {
  try {
    const { error } = await supabaseServer
      .from('configuraciones')
      .upsert(
        {
          clave: 'productos_venta',
          valor: JSON.stringify(productos),
          descripcion: 'Catálogo e inventario de productos de venta',
        },
        { onConflict: 'clave' }
      );

    if (error) {
      console.error('Error guardando lista de productos:', error);
      return { success: false, error: 'No se pudo guardar la lista de productos.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error fatal al guardar lista de productos:', error);
    return { success: false, error: error.message || 'Error interno del servidor.' };
  }
}
