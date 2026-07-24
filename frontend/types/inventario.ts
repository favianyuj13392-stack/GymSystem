export interface ProductoInventario {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria?: string;
  created_at?: string;
}
