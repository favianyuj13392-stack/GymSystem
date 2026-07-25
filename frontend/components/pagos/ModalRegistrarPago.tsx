"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Socio } from '@/types/socio';
import { ProductoConfigurado } from '@/types/pago';
import { registrarPagoManual, obtenerProductosConfigurados } from '@/app/admin/pagos/actions';
import { obtenerListaSocios } from '@/app/admin/socios/actions';

interface ModalRegistrarPagoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalRegistrarPago({
  isOpen,
  onClose,
  onSuccess,
}: ModalRegistrarPagoProps) {
  const [tipo, setTipo] = useState<'Producto' | 'Otros'>('Producto');
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState<number | string>('');
  const [metodo, setMetodo] = useState('Efectivo');
  const [socioId, setSocioId] = useState<string | null>(null);

  // Autocompletado de Socio
  const [socios, setSocios] = useState<Socio[]>([]);
  const [socioSearchQuery, setSocioSearchQuery] = useState('');
  const [isSocioDropdownOpen, setIsSocioDropdownOpen] = useState(false);
  const [selectedSocioName, setSelectedSocioName] = useState('');

  // Catálogo de Productos
  const [productos, setProductos] = useState<ProductoConfigurado[]>([]);
  const [selectedProductoId, setSelectedProductoId] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Cargar socios y catálogo de productos con respaldo en localStorage
      obtenerListaSocios().then((res) => setSocios(res as Socio[]));
      obtenerProductosConfigurados().then((res) => {
        if (res && res.length > 0) {
          setProductos(res as ProductoConfigurado[]);
        } else if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('gym_inventario_productos_v1');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setProductos(parsed as ProductoConfigurado[]);
              }
            }
          } catch (e) {}
        }
      });

      // Reset campos
      setTipo('Producto');
      setConcepto('');
      setMonto('');
      setMetodo('Efectivo');
      setSocioId(null);
      setSocioSearchQuery('');
      setSelectedSocioName('');
      setSelectedProductoId('');
      setErrorMsg('');
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProductoSelect = (prodId: string) => {
    setSelectedProductoId(prodId);
    const prod = productos.find((p) => p.id === prodId);
    if (prod) {
      setConcepto(prod.nombre);
      setMonto(prod.precio);
    }
  };

  const sociosFiltrados = socios.filter((s) => {
    const full = `${s.nombre} ${s.apellido || ''} ${s.dni}`.toLowerCase();
    return full.includes(socioSearchQuery.toLowerCase());
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!concepto.trim()) {
      setErrorMsg('Por favor ingresa un concepto o selecciona un producto.');
      return;
    }

    if (!monto || Number(monto) <= 0) {
      setErrorMsg('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    setSaving(true);
    try {
      const res = await registrarPagoManual({
        concepto: concepto.trim(),
        monto: Number(monto),
        metodo_pago: metodo,
        tipo,
        socio_id: socioId,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Error al registrar el pago.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-100">
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Registrar Nuevo Cobro</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white bg-zinc-950 rounded-full p-1 border border-zinc-850 cursor-pointer transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {errorMsg && (
            <div className="text-sm text-amber-400 bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Tipo de Ingreso</label>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
              <button
                type="button"
                onClick={() => {
                  setTipo('Producto');
                  setConcepto('');
                  setMonto('');
                  setSelectedProductoId('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tipo === 'Producto' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Venta de Producto
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipo('Otros');
                  setSelectedProductoId('');
                  setConcepto('');
                  setMonto('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  tipo === 'Otros' ? 'bg-amber-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Otros Conceptos
              </button>
            </div>
          </div>

          {tipo === 'Producto' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Catálogo de Productos</label>
              <select
                value={selectedProductoId}
                onChange={(e) => handleProductoSelect(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="" className="bg-zinc-950 text-zinc-400">
                  Selecciona un producto...
                </option>
                {productos.map((prod) => (
                  <option key={prod.id} value={prod.id} className="bg-zinc-950 text-white">
                    {prod.nombre} - Bs. {prod.precio}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Concepto *</label>
            <input
              type="text"
              required
              placeholder="Ej. Agua Mineral, Toalla, Inscripción..."
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Monto (Bs.) *</label>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors font-bold text-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Método de Pago</label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Efectivo" className="bg-zinc-950 text-white">Efectivo</option>
                <option value="Transferencia" className="bg-zinc-950 text-white">Transferencia Bancaria</option>
                <option value="Tarjeta" className="bg-zinc-950 text-white">Tarjeta de Débito/Crédito</option>
              </select>
            </div>
          </div>

          {/* Autocompletado de Socio (Opcional) */}
          <div className="relative">
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase">Socio (Opcional)</label>
            {selectedSocioName ? (
              <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white">
                <span className="font-bold text-amber-400">{selectedSocioName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSocioId(null);
                    setSelectedSocioName('');
                    setSocioSearchQuery('');
                  }}
                  className="text-zinc-500 hover:text-red-400 text-xs font-bold cursor-pointer"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Buscar socio por nombre o DNI..."
                  value={socioSearchQuery}
                  onFocus={() => setIsSocioDropdownOpen(true)}
                  onChange={(e) => {
                    setSocioSearchQuery(e.target.value);
                    setIsSocioDropdownOpen(true);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                {isSocioDropdownOpen && socioSearchQuery.trim() !== '' && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar divide-y divide-zinc-850">
                    {sociosFiltrados.length === 0 ? (
                      <div className="p-3 text-xs text-zinc-500 text-center">No se encontraron socios</div>
                    ) : (
                      sociosFiltrados.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSocioId(s.id);
                            setSelectedSocioName(`${s.nombre} ${s.apellido || ''} (${s.dni})`);
                            setIsSocioDropdownOpen(false);
                          }}
                          className="w-full text-left p-3 hover:bg-zinc-900 transition-colors flex justify-between items-center cursor-pointer"
                        >
                          <div>
                            <p className="text-sm font-bold text-white">{s.nombre} {s.apellido || ''}</p>
                            <p className="text-xs text-zinc-500">DNI: {s.dni}</p>
                          </div>
                          <span className="text-xs font-bold text-amber-500">Seleccionar</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-4 py-3 shadow-md shadow-amber-500/15 transition-all flex items-center justify-center cursor-pointer"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando...
                </>
              ) : (
                'Confirmar Cobro'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
