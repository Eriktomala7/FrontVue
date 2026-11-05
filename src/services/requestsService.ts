import axios from 'axios';

const API_URL = 'http://localhost:3000';

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EN_PROCESO';

export interface SolicitudDTO {
  id: number;
  id_usuario: number;
  id_producto: number;
  cantidad: number;
  fecha: string;
  estado_solicitud: EstadoSolicitud;
  comentario?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  usuario?: { id: number; nombre: string; email?: string };
  producto?: { id: number; codigo: string; nombre: string; unidad_medida?: string };
}

export interface NuevaSolicitud {
  id_usuario: number;
  id_producto: number;
  cantidad: number;
  comentario?: string;
  estado_solicitud: EstadoSolicitud;
}

export interface NotificacionSolicitud {
  id: number;
  tipo: 'APROBADA' | 'RECHAZADA';
  mensaje: string;
  fecha: string;
  leida?: boolean;
}

export interface NotificacionAdmin {
  id: number;
  tipo: 'PENDIENTE';
  mensaje: string;
  fecha: string;
  leida?: boolean;
}

export interface NotificacionStock {
  id: number;
  tipo: 'STOCK_AGOTADO' | string;
  mensaje: string;
  leida?: boolean;
  producto?: {
    id: number;
    nombre: string;
    codigo: string;
    cantidad: number;
  };
}

export interface NotificacionesStockResponse {
  notificaciones: NotificacionStock[];
  total: number;
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

export async function getSolicitudes(): Promise<SolicitudDTO[]> {
  const res = await api.get('/solicitudes');
  return normalizeList<SolicitudDTO>(res.data);
}

export async function getNotificaciones(idUsuario: number): Promise<NotificacionSolicitud[]> {
  const res = await api.get(`/solicitudes/usuario/${idUsuario}/notificaciones`);
  return normalizeList<NotificacionSolicitud>(res.data);
}

export async function getNotificacionesAdmin(): Promise<NotificacionAdmin[]> {
  const res = await api.get('/solicitudes/admin/notificaciones');
  return normalizeList<NotificacionAdmin>(res.data);
}

export async function getNotificacionesStock(): Promise<NotificacionesStockResponse> {
  const res = await api.get('/notificaciones');
  const payload = res.data?.data && !Array.isArray(res.data.data) ? res.data.data : res.data;
  const notificaciones = payload?.notificaciones;
  const total = payload?.total;

  if (!Array.isArray(notificaciones) || !Number.isInteger(total) || total < 0) {
    throw new Error('La respuesta de notificaciones de inventario tiene un formato inválido');
  }

  return { notificaciones: notificaciones as NotificacionStock[], total };
}

export async function marcarNotificacionLeida(id: number): Promise<void> {
  await api.patch(`/notificaciones/${id}/leida`);
}

export async function createSolicitud(payload: NuevaSolicitud): Promise<SolicitudDTO> {
  const res = await api.post('/solicitudes', payload);
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  return data as SolicitudDTO;
}

export async function actualizarEstadoSolicitud(id: number, estado: EstadoSolicitud): Promise<SolicitudDTO> {
  const res = await api.patch(`/solicitudes/${id}/estado`, { estado_solicitud: estado });
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  return data as SolicitudDTO;
}
