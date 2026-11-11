import axios from 'axios';

const API_URL = 'https://apicomple-1.onrender.com';

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  cantidad_minima?: number;
  unidad_medida: string;
  estado?: string;
  categoria?: Categoria | string;
  precio_compra?: number;
  precio_venta?: number;
  foto_producto?: string | null;
  id_usuario?: number;
}

export type NewProducto = Omit<Producto, 'id'> & { id?: never } & { id_usuario?: never };
export type UpdateProducto = Partial<Omit<Producto, 'id'>> & { id: number };

const api = axios.create({ baseURL: API_URL });

// Interceptor para añadir token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    if (!config.headers) {
      config.headers = new axios.AxiosHeaders();
    }
    const h = config.headers as any;
    if (typeof h.set === 'function') {
      h.set('Authorization', `Bearer ${token}` );
    } else {
      h['Authorization'] = `Bearer ${token}` ;
    }
  }

  console.log(`🚀 HTTP ${config.method?.toUpperCase()} ${config.url}`);
  console.log('📤 Datos enviados:', config.data);
  console.log('📋 Headers:', config.headers);

  return config;
});

// Interceptor para logs de respuesta
api.interceptors.response.use(
  (response) => {
    console.log(`✅ HTTP ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('📥 Respuesta del backend:', response.data);
    return response;
  },
  (error) => {
    console.error(`❌ HTTP ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('💥 Error del backend:', error.response?.data);
    return Promise.reject(error);
  }
);

function normalizeList<T = any>(data: any): T[] {
  return Array.isArray(data) ? data : data?.data || [];
}

export async function getProductos(): Promise<Producto[]> {
  const res = await api.get('/productos');
  const items = normalizeList<Producto>(res.data);
  return items as Producto[];
}

export async function createProducto(payload: NewProducto): Promise<Producto> {
  // ✅ CORRECCIÓN: Usar clave 'user' consistente
  const usuarioLogueado = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Incluir id_usuario automáticamente para movimiento automático
  const payloadConUsuario = {
    ...payload,
    id_usuario: usuarioLogueado.id
  };
  
  console.log('=== PRODUCTS SERVICE - DATOS AL BACKEND ===');
  console.log('Usuario autenticado:', usuarioLogueado);
  console.log('Payload enviado:', payloadConUsuario);
  console.log('========================================');
  
  const res = await api.post('/productos', payloadConUsuario);
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  
  console.log('=== PRODUCTS SERVICE - RESPUESTA DEL BACKEND ===');
  console.log('Producto creado:', data);
  console.log('========================================');
  
  return data as Producto;
}

export async function updateProducto(id: number, payload: Partial<NewProducto>): Promise<Producto> {
  const res = await api.put(`/productos/${id}` , payload);
  const data = Array.isArray(res.data) ? res.data[0] : (res.data?.data ?? res.data);
  return data as Producto;
}

export async function deleteProducto(id: number): Promise<{ success: boolean; message?: string } | void> {
  const res = await api.delete(`/productos/${id}`);
  if (res.data && typeof res.data === 'object') return res.data;
}