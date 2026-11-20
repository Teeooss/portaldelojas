const ITERACOES = 120_000;
const enc = new TextEncoder();
function paraHex(bytes: Uint8Array) { return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''); }
function deHex(texto: string) { return new Uint8Array(texto.match(/.{2}/g)?.map((b) => Number.parseInt(b, 16)) ?? []); }

export async function hashSenha(senha: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const chave = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: ITERACOES }, chave, 256);
  return `${ITERACOES}:${paraHex(sal)}:${paraHex(new Uint8Array(bits))}`;
}
export async function verificarSenha(senha: string, guardada: string): Promise<boolean> {
  const [iteracoes, salHex, hashHex] = guardada.split(':');
  const quantidade = Number(iteracoes); if (!quantidade || !salHex || !hashHex) return false;
  const chave = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: deHex(salHex), iterations: quantidade }, chave, 256));
  const esperado = deHex(hashHex); return bits.length === esperado.length && bits.every((v, i) => v === esperado[i]);
}
