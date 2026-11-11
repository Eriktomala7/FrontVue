import axios from 'axios';

const API_URL = 'https://apicomple-1.onrender.com';

export type Rol = 'ADMIN' | 'USUARIO';
export type Estado = 'ACTIVO' | 'INACTIVO';

export interface UsuarioDTO {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  estado: Estado;
  foto_perfil?: string | null;
}

export interface NewUsuario {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  estado?: Estado;
}

export interface UpdateUsuario {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: Rol;
  estado?: Estado;
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

export async function getUsuarios(): Promise<UsuarioDTO[]> {
  const res = await api.get('/usuarios');
  return normalizeList<UsuarioDTO>(res.data);
}

export async function createUsuario(payload: NewUsuario): Promise<UsuarioDTO> {
  const res = await api.post('/usuarios', payload);
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  return data as UsuarioDTO;
}

export async function updateUsuario(id: number, payload: UpdateUsuario): Promise<UsuarioDTO> {
  const res = await api.put(`/usuarios/${id}`, payload);
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  return data as UsuarioDTO;
}

export async function deleteUsuario(id: number): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}
