import axios from 'axios';
import { getToken } from './authService';

const API_URL = 'https://apicomple-1.onrender.com';

export interface InventoryReportParams {
  fechaInicio?: string;
  fechaFin?: string;
  idCategoria?: number;
  estado?: string;
}

export interface MovementReportParams {
  fechaInicio?: string;
  fechaFin?: string;
  tipoMovimiento?: string;
  idProducto?: number;
}

export interface LowStockReportParams {
  nivelAlerta?: number;
  idCategoria?: number;
}

export interface ProductoReporte {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  cantidad_minima: number;
  unidad_medida: string;
  categoria: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface ProductoMovimiento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  id_categoria: number;
  cantidad: number;
  precio_compra: number;
  precio_venta: number;
  unidad_medida: string;
  estado: string;
  foto_producto: string | null;
}

export interface UsuarioMovimiento {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  foto_perfil: string | null;
}

export interface MovimientoReporte {
  id: number;
  id_producto: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  motivo: string;
  fecha: string;
  id_usuario: number;
  estado: string;
  producto: ProductoMovimiento;
  usuario: UsuarioMovimiento;
}

export interface ProductoMasMovimientosReporte {
  producto: {
    id?: number;
    codigo?: string;
    nombre?: string;
    categoria?: string | { nombre: string };
  };
  totalMovimientos: number;
}

const ReportsService = {
  async getInventoryReport(params: InventoryReportParams = {}): Promise<ProductoReporte[]> {
    const response = await axios.get(`${API_URL}/reportes/inventario`, { params });
    // Normalize response
    const items = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return items.map((item: any) => ({
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      cantidad: item.cantidad ?? 0,
      cantidad_minima: item.cantidad_minima ?? item.stock_minimo ?? 0,
      unidad_medida: item.unidad_medida ?? 'unidad',
      categoria: item.categoria?.nombre ?? item.categoria ?? 'Sin categoría',
      estado: item.estado ?? 'ACTIVO',
      fecha_creacion: item.fecha_creacion ?? '',
      fecha_actualizacion: item.fecha_actualizacion ?? '',
    }));
  },

  async getMovementReport(params: MovementReportParams = {}): Promise<MovimientoReporte[]> {
    const queryParams: Record<string, any> = {};
    if (params.fechaInicio) queryParams.fechaInicio = params.fechaInicio;
    if (params.fechaFin) queryParams.fechaFin = params.fechaFin;
    if (params.tipoMovimiento && params.tipoMovimiento !== 'TODOS') {
      queryParams.tipo = params.tipoMovimiento;
      queryParams.tipoMovimiento = params.tipoMovimiento;
    }
    if (params.idProducto) queryParams.id_producto = params.idProducto;

    const response = await axios.get(`${API_URL}/reportes/movimientos`, { params: queryParams });

    // Normalize to array
    let movimientos: any[] = [];
    if (response.data && Array.isArray(response.data.data)) movimientos = response.data.data;
    else if (Array.isArray(response.data)) movimientos = response.data;
    else if (response.data && typeof response.data === 'object') {
      const key = Object.keys(response.data).find(k => Array.isArray(response.data[k]));
      if (key) movimientos = response.data[key];
    }

    const normalizedMovimientos = movimientos.map((mov: any) => ({
      id: mov.id,
      id_producto: mov.id_producto,
      tipo: mov.tipo,
      cantidad: mov.cantidad,
      motivo: mov.motivo || '',
      fecha: mov.fecha,
      id_usuario: mov.id_usuario,
      estado: mov.estado || 'ACTIVO',
      producto: {
        id: mov.producto?.id || 0,
        codigo: mov.producto?.codigo || '',
        nombre: mov.producto?.nombre || 'Producto no encontrado',
        descripcion: mov.producto?.descripcion || '',
        id_categoria: mov.producto?.id_categoria || 0,
        cantidad: mov.producto?.cantidad || 0,
        precio_compra: mov.producto?.precio_compra || 0,
        precio_venta: mov.producto?.precio_venta || 0,
        unidad_medida: mov.producto?.unidad_medida || 'unidad',
        estado: mov.producto?.estado || 'INACTIVO',
        foto_producto: mov.producto?.foto_producto || null,
      },
      usuario: {
        id: mov.usuario?.id || 0,
        nombre: mov.usuario?.nombre || 'Usuario desconocido',
        email: mov.usuario?.email || '',
        rol: mov.usuario?.rol || 'USUARIO',
        estado: mov.usuario?.estado || 'INACTIVO',
        foto_perfil: mov.usuario?.foto_perfil || null,
      },
    }));

    if (!params.tipoMovimiento || params.tipoMovimiento === 'TODOS') return normalizedMovimientos;
    return normalizedMovimientos.filter(
      movimiento => String(movimiento.tipo).toUpperCase() === params.tipoMovimiento?.toUpperCase()
    );
  },

  async getLowStockReport(params: LowStockReportParams = {}): Promise<ProductoReporte[]> {
    const response = await axios.get(`${API_URL}/reportes/bajo-stock`, { params });
    const items = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return items.map((item: any) => ({
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      cantidad: item.cantidad ?? 0,
      cantidad_minima: item.cantidad_minima ?? item.stock_minimo ?? 0,
      unidad_medida: item.unidad_medida ?? 'unidad',
      categoria: item.categoria?.nombre ?? item.categoria ?? 'Sin categoría',
      estado: item.estado ?? 'ACTIVO',
      fecha_creacion: item.fecha_creacion ?? '',
      fecha_actualizacion: item.fecha_actualizacion ?? '',
    }));
  },

  async getProductWithMostMovementsReport(): Promise<ProductoMasMovimientosReporte | null> {
    const token = getToken();
    if (!token) throw new Error('Se requiere una sesión de administrador para consultar este reporte');

    const response = await axios.get(`${API_URL}/reportes/producto-mas-movimientos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = response.data && Object.prototype.hasOwnProperty.call(response.data, 'data')
      ? response.data.data
      : response.data;

    if (payload === null) return null;
    if (
      !payload ||
      typeof payload.producto !== 'object' ||
      payload.producto === null ||
      typeof payload.totalMovimientos !== 'number' ||
      !Number.isInteger(payload.totalMovimientos) ||
      payload.totalMovimientos < 0
    ) {
      throw new Error('La respuesta del reporte de productos con más movimientos tiene un formato inválido');
    }

    return {
      producto: payload.producto,
      totalMovimientos: payload.totalMovimientos,
    };
  },
};

export default ReportsService;
