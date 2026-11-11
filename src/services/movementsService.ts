import axios from 'axios';

const API_URL = 'https://apicomple-1.onrender.com';

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface Movimiento {
  id: number;
  id_producto: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
  fecha: string;
  id_usuario: number;
  estado?: 'ACTIVO' | 'INACTIVO';
  producto?: {
    id: number;
    codigo: string;
    nombre: string;
    unidad_medida?: string;
  };
  usuario?: {
    id: number;
    nombre: string;
    email?: string;
  };
}

export interface MovimientoCreate {
  id_producto: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
}

export interface MovimientoUpdate {
  tipo?: TipoMovimiento;
  cantidad?: number;
  motivo?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface MovimientoFilters {
  fechaInicio?: string; // YYYY-MM-DD
  fechaFin?: string;    // YYYY-MM-DD
  tipoMovimiento?: TipoMovimiento; // se mapeará a 'tipo'
  idProducto?: number;             // se mapeará a 'id_producto'
}

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (!config.headers) config.headers = new axios.AxiosHeaders();
    const h = config.headers as any;
    if (typeof h.set === 'function') h.set('Authorization', `Bearer ${token}`);
    else h['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

function normalizeList<T = any>(data: any): T[] {
  return Array.isArray(data) ? data : data?.data || [];
}

export async function getMovimientos(filters: MovimientoFilters = {}): Promise<Movimiento[]> {
  const params: Record<string, any> = {};
  if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
  if (filters.fechaFin) params.fechaFin = filters.fechaFin;
  if (filters.tipoMovimiento) params.tipo = filters.tipoMovimiento;
  if (filters.idProducto) params.id_producto = filters.idProducto;

  const res = await api.get('/movimientos', { params });
  return normalizeList<Movimiento>(res.data) as Movimiento[];
}

export async function createMovimiento(payload: MovimientoCreate): Promise<Movimiento> {
  const res = await api.post('/movimientos', payload);
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  return data as Movimiento;
}

export async function updateMovimiento(id: number, payload: MovimientoUpdate): Promise<Movimiento> {
  const res = await api.put(`/movimientos/${id}`, payload);
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  return data as Movimiento;
}

export async function deleteMovimiento(id: number): Promise<{ success: boolean; message?: string } | void> {
  const res = await api.delete(`/movimientos/${id}`);
  if (res.data && typeof res.data === 'object') return res.data;
}
