import axios from 'axios';

const API_URL = 'https://apicomple-1.onrender.com/auth';

export interface User {
  id: string | number;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'USUARIO';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
  rol: 'USUARIO';
}

export async function register(payload: RegisterPayload): Promise<void> {
  await axios.post(`${API_URL}/register`, { ...payload, rol: 'USUARIO' });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await axios.post('https://apicomple-1.onrender.com/usuarios/recuperar', { email });
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await axios.post(`${API_URL}/login`, { email, password }, { validateStatus: s => s < 500 });
  if (res.status >= 400) throw new Error(res.data?.message || 'Error en la autenticación');

  const data = res.data;
  const token = data.token || data.access_token || data.data?.token;
  const userData = data.user || data;
  if (!token) throw new Error('No se recibió un token');

  const user: User = {
    id: userData.id,
    email: userData.email,
    nombre: userData.nombre || userData.name || '',
    rol: (userData.rol || data.rol || 'USUARIO').toUpperCase(),
  } as User;

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  setAxiosAuthHeader(token);
  return { token, user };
}

export function getCurrentUser(): User | null {
  const str = localStorage.getItem('user');
  return str ? JSON.parse(str) : null;
}

export function updateCurrentUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent<User>('auth-user-updated', { detail: user }));
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setAxiosAuthHeader(token?: string | null) {
  const t = token ?? getToken();
  if (t) axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
  else delete axios.defaults.headers.common['Authorization'];
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    setAxiosAuthHeader();
    const res = await axios.get(`${API_URL}/me`, { validateStatus: s => s < 500 });
    if (res.status >= 400) return null;
    const u = res.data as User;
    localStorage.setItem('user', JSON.stringify(u));
    return u;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  window.location.href = '/login';
}
