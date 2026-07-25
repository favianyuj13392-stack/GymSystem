"use client";

import { useState, useEffect } from 'react';
import { ProductoInventario } from '@/types/inventario';
import { obtenerProductosInventario, guardarListaProductos } from './actions';

const LOCAL_STORAGE_KEY = 'gym_inventario_productos_v1';

export default function InventarioPage() {
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<number | string>('');
  const [stock, setStock] = useState<number | string>('');
  const [categoria, setCategoria] = useState('Suplementos');
  const [errorForm, setErrorForm] = useState('');

  const fetchProductos = async () => {
    setLoading(true);
    let serverData: ProductoInventario[] = [];

    try {
      serverData = await obtenerProductosInventario();
    } catch (e) {
      console.warn('Error fetching server inventory:', e);
    }

    if (serverData && serverData.length > 0) {
      setProductos(serverData);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverData));
        } catch (e) {}
      }
    } else {
      // Fallback a localStorage si el servidor aún no tiene registros o falla
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProductos(parsed);
            }
          }
        } catch (e) {}
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const persistirProductos = (newList: ProductoInventario[]) => {
    setProductos(newList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
      } catch (e) {}
    }
    guardarListaProductos(newList);
  };

  const abrirModalCrear = () => {
    setEditingId(null);
    setNombre('');
    setPrecio('');
    setStock(10);
    setCategoria('Suplementos');
    setErrorForm('');
    setIsModalOpen(true);
  };

  const abrirModalEditar = (prod: ProductoInventario) => {
    setEditingId(prod.id);
    setNombre(prod.nombre);
    setPrecio(prod.precio);
    setStock(prod.stock);
    setCategoria(prod.categoria || 'General');
    setErrorForm('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');

    if (!nombre.trim()) {
      setErrorForm('Ingresá un nombre para el producto.');
      return;
    }
    if (precio === '' || Number(precio) < 0) {
      setErrorForm('Ingresá un precio válido.');
      return;
    }
    if (stock === '' || Number(stock) < 0) {
      setErrorForm('Ingresá una cantidad de stock válida.');
      return;
    }

    setSaving(true);
    let updatedList: ProductoInventario[];

    if (editingId) {
      updatedList = productos.map((p) =>
        p.id === editingId
          ? {
              ...p,
              nombre: nombre.trim(),
              precio: Number(precio),
              stock: Number(stock),
              categoria,
            }
          : p
      );
    } else {
      const nuevoProd: ProductoInventario = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        nombre: nombre.trim(),
        precio: Number(precio),
        stock: Number(stock),
        categoria,
      };
      updatedList = [...productos, nuevoProd];
    }

    persistirProductos(updatedList);
    setSaving(false);
    setIsModalOpen(false);
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    const updatedList = productos.map((p) => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock + delta);
        return { ...p, stock: newStock };
      }
      return p;
    });

    persistirProductos(updatedList);
  };

  const handleEliminarProducto = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto del inventario?')) return;
    const updatedList = productos.filter((p) => p.id !== id);
    persistirProductos(updatedList);
  };

  const productosFiltrados = productos.filter((p) =>
    `${p.nombre} ${p.categoria || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/15 via-zinc-950 to-black text-slate-100 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Inventario de Productos y Venta</h1>
            <p className="text-zinc-400 mt-1">Controlá el stock de bebidas, suplementos y accesorios a la venta.</p>
          </div>
          <button
            type="button"
            onClick={abrirModalCrear}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-amber-500/15 transition-colors flex items-center cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Producto
          </button>
        </div>

        {/* Buscador */}
        <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 flex justify-between items-center shadow-lg">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar producto por nombre o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors bg-zinc-950 text-white text-sm"
            />
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/60 border-b border-zinc-800">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      Cargando inventario de productos...
                    </td>
                  </tr>
                ) : productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No hay productos registrados en el inventario.
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((prod) => (
                    <tr key={prod.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white text-base">{prod.nombre}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-lg text-zinc-300">
                          {prod.categoria || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black text-amber-400 text-base">
                          Bs. {Number(prod.precio).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              prod.stock > 10
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : prod.stock > 0
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {prod.stock} unidades
                          </span>
                          <div className="flex gap-1 ml-2">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(prod.id, -1)}
                              className="w-7 h-7 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer"
                              title="Restar 1"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(prod.id, 1)}
                              className="w-7 h-7 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer"
                              title="Sumar 1"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(prod)}
                          className="bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarProducto(prod.id)}
                          className="bg-zinc-950 hover:bg-red-950/40 text-zinc-500 hover:text-red-400 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Crear / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="p-6 border-b border-zinc-800 bg-zinc-950/60 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Editar Producto' : 'Nuevo Producto en Inventario'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white bg-zinc-950 rounded-full p-1 border border-zinc-850 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {errorForm && (
                <div className="text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                  {errorForm}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Bebida Rehidratante 500ml"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Precio (Bs.) *</label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    placeholder="15.00"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Stock Inicial *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Suplementos" className="bg-zinc-950 text-white">Suplementos & Proteínas</option>
                  <option value="Bebidas" className="bg-zinc-950 text-white">Bebidas e Hidratación</option>
                  <option value="Snacks" className="bg-zinc-950 text-white">Snacks & Barras</option>
                  <option value="Accesorios" className="bg-zinc-950 text-white">Accesorios & Indumentaria</option>
                  <option value="General" className="bg-zinc-950 text-white">General / Otros</option>
                </select>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 cursor-pointer"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/15 cursor-pointer flex items-center justify-center"
                >
                  {saving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
