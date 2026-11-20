import type { Env, UsuarioAutenticado } from './http';

const DURACAO_DIAS = 14;
const COOKIE = 'vitrine_session';
const enc = new TextEncoder();
async function digest(texto: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(texto))), (b) => b.toString(16).padStart(2, '0')).join(''); }
function tokenAleatorio() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join(''); }
function lerCookie(request: Request): string | null {
  const cookies = request.headers.get('Cookie')?.split(';') ?? [];
  for (const parte of cookies) { const [nome, ...resto] = parte.trim().split('='); if (nome === COOKIE) return resto.join('=') || null; }
  return null;
}

export async function criarSessao(env: Env, usuarioId: string, dispositivoId: string | null) {
  const token = tokenAleatorio(); const id = await digest(token); const expira = new Date(Date.now() + DURACAO_DIAS * 86400000).toISOString();
  await env.LOJAS_DB.prepare('INSERT INTO sessoes (id, usuario_id, dispositivo_id, expira_em) VALUES (?, ?, ?, ?)').bind(id, usuarioId, dispositivoId, expira).run();
  return { 'Set-Cookie': `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${DURACAO_DIAS * 86400}` };
}
export async function validarSessao(env: Env, request: Request): Promise<UsuarioAutenticado | null> {
  const token = lerCookie(request); if (!token) return null;
  const sessionId = await digest(token);
  const row = await env.LOJAS_DB.prepare(`SELECT u.id, u.nome, u.email, u.status, s.expira_em
    FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.id = ?`).bind(sessionId).first<{id:string;nome:string;email:string;status:string;expira_em:string}>();
  if (!row || row.status !== 'Ativo' || row.expira_em <= new Date().toISOString()) return null;
  const permissoes = await env.LOJAS_DB.prepare('SELECT permissao FROM usuario_permissoes WHERE usuario_id = ?').bind(row.id).all<{ permissao: string }>();
  return { id: row.id, nome: row.nome, email: row.email, permissoes: permissoes.results.map((p) => p.permissao) };
}
export async function revogarSessao(env: Env, request: Request) {
  const token = lerCookie(request); if (token) await env.LOJAS_DB.prepare('DELETE FROM sessoes WHERE id = ?').bind(await digest(token)).run();
  return { 'Set-Cookie': `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` };
}
