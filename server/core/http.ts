export interface Env { LOJAS_DB: D1Database }
export interface UsuarioAutenticado { id: string; nome: string; email: string; permissoes: string[] }
export type AppData = { usuario?: UsuarioAutenticado };
export type AppContext = EventContext<Env, string, AppData>;

export function json(dados: unknown, status = 200, headers: HeadersInit = {}): Response {
  const saida = new Headers(headers); saida.set('Content-Type', 'application/json; charset=utf-8');
  saida.set('Cache-Control', 'private, no-store');
  return new Response(JSON.stringify(dados), { status, headers: saida });
}
export function erro(mensagem: string, status = 400): Response { return json({ erro: mensagem }, status); }
export async function lerCorpo<T>(request: Request): Promise<T> {
  try { return await request.json() as T; } catch { throw new Error('Envie um JSON válido.'); }
}
export function validarEmail(email: string): string { return email.trim().toLowerCase(); }
