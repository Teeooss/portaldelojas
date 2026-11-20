import { listarReferenciasMunicipais, obterReferenciaMunicipal } from '../municipios/municipios.public';
import type { ReferenciaMunicipal } from '../municipios/municipios.public';

interface LojaPayload {
  nome: string;
  categoria: string;
  municipioId: string;
  endereco: string;
  telefone: string;
  email: string;
  responsavel: string;
}

interface LojaRow {
  id: string;
  nome: string;
  categoria: string;
  municipioId: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
}

function apresentarLoja(loja: LojaRow, municipio?: ReferenciaMunicipal | null) {
  if (!municipio) throw new Error('Loja sem referência municipal válida.');
  return { ...loja, cidade: municipio.nome, uf: municipio.uf, regiao: municipio.regiao };
}

export async function listarLojas(db: D1Database) {
  const dados = await db.prepare('SELECT id, nome, categoria, municipio_id AS municipioId FROM lojas ORDER BY nome')
    .all<LojaRow>();
  if (!dados.results.length) return [];
  const ids = [...new Set(dados.results.map((loja) => loja.municipioId))];
  const referencias = await listarReferenciasMunicipais(db, ids);
  const municipios = new Map(referencias.map((municipio) => [municipio.id, municipio]));
  return dados.results.map((loja) => apresentarLoja(loja, municipios.get(loja.municipioId)));
}

export async function obterLoja(db: D1Database, id: string, incluirContato: boolean) {
  const consulta = incluirContato
    ? 'SELECT id, nome, categoria, municipio_id AS municipioId, endereco, telefone, email, responsavel FROM lojas WHERE id = ?'
    : 'SELECT id, nome, categoria, municipio_id AS municipioId, endereco FROM lojas WHERE id = ?';
  const loja = await db.prepare(consulta).bind(id).first<LojaRow>();
  if (!loja) return null;
  return apresentarLoja(loja, await obterReferenciaMunicipal(db, loja.municipioId));
}

export function validarLoja(body: unknown): LojaPayload | null {
  if (!body || typeof body !== 'object') return null;
  const entrada = body as Record<string, unknown>;
  const ler = (campo: string) => typeof entrada[campo] === 'string' ? entrada[campo].trim() : '';
  const loja = {
    nome: ler('nome'), categoria: ler('categoria'), municipioId: ler('municipioId'),
    endereco: ler('endereco'), telefone: ler('telefone'), email: ler('email'), responsavel: ler('responsavel'),
  };
  if (!loja.nome || !loja.categoria || !loja.endereco || !loja.municipioId) return null;
  if (Object.values(loja).some((valor) => valor.length > 160)) return null;
  if (loja.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loja.email)) return null;
  return loja;
}

export async function cadastrarLoja(db: D1Database, dados: LojaPayload) {
  const municipio = await obterReferenciaMunicipal(db, dados.municipioId);
  if (!municipio) return null;
  const id = crypto.randomUUID();
  try {
    await db.prepare(`INSERT INTO lojas (id, nome, categoria, municipio_id, endereco, telefone, email, responsavel, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Ativa')`)
      .bind(id, dados.nome, dados.categoria, municipio.id, dados.endereco, dados.telefone, dados.email, dados.responsavel)
      .run();
  } catch (falha) {
    if (falha instanceof Error && falha.message.includes('FOREIGN KEY constraint failed')) return null;
    throw falha;
  }
  return { id };
}
