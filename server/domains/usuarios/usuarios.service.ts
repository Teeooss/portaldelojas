import { validarEmail } from '../../core/http';
import { hashSenha, verificarSenha } from '../../core/senha';

import type { PermissaoKey } from '../../../src/app/core/permissions/permission.model';

type Status = 'Ativo' | 'Pendente' | 'Suspenso';
type Alteracao = { status: Status; permissoes: PermissaoKey[]; versao: number };
interface Usuario {
  id: string;
  nome: string;
  email: string;
  status: Status;
  versao: number;
}

const CHAVES = {
  'lojas.acessar': true, 'lojas.gravar.incluir': true, 'lojas.contato.visualizar': true,
  'municipios.acessar': true, 'municipios.gravar.incluir': true,
  'municipios.gravar.editar': true, 'municipios.apagar': true,
  'usuarios.acessar': true, 'usuarios.gravar.editar': true,
} satisfies Record<PermissaoKey, true>;

export function validarAlteracao(body: unknown): Alteracao | null {
  if (!body || typeof body !== 'object') return null;
  const { status, permissoes, versao } = body as Partial<Alteracao>;
  if (status !== 'Ativo' && status !== 'Pendente' && status !== 'Suspenso') return null;
  if (typeof versao !== 'number' || !Number.isSafeInteger(versao) || versao < 1) return null;
  if (!Array.isArray(permissoes) || permissoes.length > Object.keys(CHAVES).length ||
    !permissoes.every((chave) => typeof chave === 'string' && Object.hasOwn(CHAVES, chave))) return null;
  return { status, permissoes: [...new Set(permissoes)], versao };
}

export async function listarUsuarios(db: D1Database) {
  const [usuarios, permissoes] = await db.batch([
    db.prepare('SELECT id, nome, email, status, versao FROM usuarios ORDER BY nome COLLATE NOCASE'),
    db.prepare('SELECT usuario_id, permissao FROM usuario_permissoes'),
  ]);
  const chaves = new Map<string, string[]>();
  for (const linha of permissoes.results as { usuario_id: string; permissao: string }[]) {
    const lista = chaves.get(linha.usuario_id) ?? [];
    lista.push(linha.permissao);
    chaves.set(linha.usuario_id, lista);
  }
  return (usuarios.results as unknown as Usuario[]).map((usuario) => ({ ...usuario, permissoes: chaves.get(usuario.id) ?? [] }));
}

export async function atualizarUsuario(db: D1Database, id: string, autor: { id: string; permissoes: string[] }, dados: Alteracao) {
  if (id === autor.id) return { erro: 'Você não pode alterar o seu próprio acesso.', status: 403 } as const;
  const usuario = await db.prepare('SELECT id, nome, email, status, versao FROM usuarios WHERE id = ?').bind(id).first<Usuario>();
  if (!usuario) return { erro: 'Usuário não encontrado.', status: 404 } as const;
  if (!dados.permissoes.every((chave) => autor.permissoes.includes(chave))) {
    return { erro: 'Você só pode conceder permissões que possui.', status: 403 } as const;
  }
  const atuais = await db.prepare('SELECT permissao FROM usuario_permissoes WHERE usuario_id = ?').bind(id).all<{ permissao: string }>();
  if (!atuais.results.every(({ permissao }) => autor.permissoes.includes(permissao))) {
    return { erro: 'A administração desse acesso requer permissões adicionais.', status: 403 } as const;
  }
  if (usuario.versao !== dados.versao) return { erro: 'O acesso foi alterado. Feche o formulário e abra novamente.', status: 409 } as const;

  // O lote é atômico. Cada operação depende da versão original do usuário.
  const mesmaVersao = 'EXISTS (SELECT 1 FROM usuarios WHERE id = ? AND versao = ?)';
  const resultados = await db.batch([
    db.prepare(`DELETE FROM usuario_permissoes WHERE usuario_id = ? AND ${mesmaVersao}`).bind(id, id, dados.versao),
    db.prepare(`INSERT INTO usuario_permissoes (usuario_id, permissao)
      SELECT ?, value FROM json_each(?) WHERE ${mesmaVersao}`).bind(id, JSON.stringify(dados.permissoes), id, dados.versao),
    db.prepare(`DELETE FROM sessoes WHERE usuario_id = ? AND ? <> 'Ativo' AND ${mesmaVersao}`).bind(id, dados.status, id, dados.versao),
    db.prepare('UPDATE usuarios SET status = ?, atualizado_em = CURRENT_TIMESTAMP, versao = versao + 1 WHERE id = ? AND versao = ?')
      .bind(dados.status, id, dados.versao),
  ]);
  if (!resultados[3].meta.changes) return { erro: 'O acesso foi alterado. Feche o formulário e abra novamente.', status: 409 } as const;
  return { usuario: { ...usuario, status: dados.status, permissoes: dados.permissoes, versao: dados.versao + 1 } };
}

const PERMISSAO_INICIAL = 'lojas.acessar' satisfies PermissaoKey;

export function dadosDeLogin(entrada: unknown) {
  if (!entrada || typeof entrada !== 'object') return null;
  const body = entrada as Record<string, unknown>;
  if (typeof body.email !== 'string' || typeof body.senha !== 'string') return null;
  const email = validarEmail(body.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null;
  if (body.senha.length < 8 || body.senha.length > 128) return null;
  return { email, senha: body.senha };
}

export async function cadastrarUsuario(db: D1Database, entrada: unknown) {
  const dados = dadosDeLogin(entrada);
  const nomeBruto = (entrada as { nome?: unknown } | null)?.nome;
  const nome = typeof nomeBruto === 'string' ? nomeBruto.trim() : '';
  if (!dados || !nome || nome.length > 100) return null;
  const id = crypto.randomUUID();
  const senhaHash = await hashSenha(dados.senha);
  await db.batch([
    db.prepare("INSERT INTO usuarios (id, nome, email, senha_hash, status) VALUES (?, ?, ?, ?, 'Pendente')")
      .bind(id, nome, dados.email, senhaHash),
    db.prepare('INSERT INTO usuario_permissoes (usuario_id, permissao) VALUES (?, ?)').bind(id, PERMISSAO_INICIAL),
  ]);
  return { status: 'Pendente' } as const;
}

export async function autenticarUsuario(db: D1Database, entrada: unknown) {
  const dados = dadosDeLogin(entrada);
  if (!dados) return null;
  const conta = await db.prepare('SELECT id, nome, email, senha_hash, status FROM usuarios WHERE email = ?')
    .bind(dados.email).first<Usuario & { senha_hash: string }>();
  if (!conta || !(await verificarSenha(dados.senha, conta.senha_hash))) return null;
  if (conta.status === 'Pendente') return { status: 'Pendente' } as const;
  if (conta.status !== 'Ativo') return null;
  const chaves = await db.prepare('SELECT permissao FROM usuario_permissoes WHERE usuario_id = ?')
    .bind(conta.id).all<{ permissao: PermissaoKey }>();
  return { status: 'Ativo', usuario: {
    id: conta.id, nome: conta.nome, email: conta.email,
    permissoes: chaves.results.map(({ permissao }) => permissao),
  } } as const;
}
