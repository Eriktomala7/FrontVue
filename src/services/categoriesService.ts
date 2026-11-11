import axios from 'axios';

const API_URL = 'https://apicomple-1.onrender.com';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export type NewCategoria = Omit<Categoria, 'id'> & { id?: never };

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

export async function getCategorias(): Promise<Categoria[]> {
  const res = await api.get('/categorias');
  return normalizeList<Categoria>(res.data);
}

export async function createCategoria(payload: NewCategoria): Promise<Categoria> {
  const res = await api.post('/categorias', payload);
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  return data as Categoria;
}

export async function updateCategoria(id: number, payload: Partial<NewCategoria>): Promise<Categoria> {
  const res = await api.put(`/categorias/${id}`, payload);
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  return data as Categoria;
}

export async function deleteCategoria(id: number): Promise<void> {
  await api.delete(`/categorias/${id}`);
}
