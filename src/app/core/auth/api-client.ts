import { obterIdDispositivo } from './dispositivo.service';

const API = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch<T>(rota: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Device-Id', obterIdDispositivo());
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API}${rota}`, { ...init, headers, credentials: 'include' });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => undefined);
  if (response.status === 401 && !rota.startsWith('/auth/')) window.dispatchEvent(new Event('sessao-expirada'));
  if (!response.ok) throw new Error((body as { erro?: string } | null)?.erro || 'Não foi possível concluir a solicitação.');
  if (body === undefined) throw new Error('O servidor retornou uma resposta inválida.');
  return body as T;
}
