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
      let parsed = JSON.parse(productosRow.valor);
      
      // Desempaquetar matrices anidadas si existen por datos corruptos antiguos
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
    return [];
  }
}

export async function guardarListaProductos(productos: ProductoInventario[]) {
  try {
    // Aplanar y limpiar el arreglo para garantizar que sea un arreglo 1D sin anidamiento
    let flatList = Array.isArray(productos) ? productos.flat(Infinity) : [];
    flatList = flatList.filter((item: any) => item && typeof item === 'object' && !Array.isArray(item) && item.nombre);

    const { error } = await supabaseServer
      .from('configuraciones')
      .upsert(
        {
          clave: 'productos_venta',
          valor: JSON.stringify(flatList),
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
