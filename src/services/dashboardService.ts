import axios from 'axios';

const API_URL = 'http://localhost:3000';

export interface MovimientoReciente {
  id: number;
  producto: { id: number; nombre: string; codigo: string };
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  fecha: string;
  motivo?: string;
  usuario: { id: number; nombre: string; email?: string };
}

export async function getRecentMovements(limit = 5): Promise<MovimientoReciente[]> {
  const res = await axios.get(`${API_URL}/productos/dashboard/movimientos-recientes`, {
    params: { limit },
  });
  // Normalize: support res.data or res.data.data
  const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
  return data as MovimientoReciente[];
}
