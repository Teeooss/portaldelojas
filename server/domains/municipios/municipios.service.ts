import type { ReferenciaMunicipal } from '../../../contracts/municipios.public';
import { lerMunicipio } from './municipios.model';

export async function listarMunicipios(db: D1Database, ids?: readonly string[]) {
  const consulta = ids
    ? db.prepare('SELECT id, nome, uf, regiao FROM municipios WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ids))
    : db.prepare('SELECT id, nome, uf, regiao FROM municipios ORDER BY nome_chave, uf');
  return (await consulta.all<ReferenciaMunicipal>()).results;
}

export function obterMunicipio(db: D1Database, id: string) {
  return db.prepare('SELECT id, nome, uf, regiao FROM municipios WHERE id = ?')
    .bind(id).first<ReferenciaMunicipal>();
}

export async function gravarMunicipio(db: D1Database, entrada: unknown, id?: string) {
  const dados = lerMunicipio(entrada);
  if (!dados) return { erro: 'Informe um nome válido e selecione uma UF.', status: 400 } as const;
  const chave = id ?? crypto.randomUUID();
  const { nome, uf, regiao, nomeChave } = dados;
  try {
    const comando = id !== undefined
      ? db.prepare('UPDATE municipios SET nome = ?, uf = ?, regiao = ?, nome_chave = ? WHERE id = ?')
      : db.prepare('INSERT INTO municipios (nome, uf, regiao, nome_chave, id) VALUES (?, ?, ?, ?, ?)');
    const resultado = await comando.bind(nome, uf, regiao, nomeChave, chave).run();
    if (!resultado.meta.changes) return { erro: 'Município não encontrado.', status: 404 } as const;
    return { municipio: { id: chave, nome, uf, regiao } };
  } catch (falha) {
    if (falha instanceof Error && falha.message.includes('UNIQUE constraint failed: municipios.uf, municipios.nome_chave')) {
      return { erro: 'Já existe um município com esse nome na UF selecionada.', status: 409 } as const;
    }
    throw falha;
  }
}

export async function excluirMunicipio(db: D1Database, id: string) {
  try {
    const resultado = await db.prepare('DELETE FROM municipios WHERE id = ?').bind(id).run();
    if (!resultado.meta.changes) return { erro: 'Município não encontrado.', status: 404 } as const;
    return { ok: true } as const;
  } catch (falha) {
    if (falha instanceof Error && falha.message.includes('FOREIGN KEY constraint failed')) {
      return { erro: 'Este município está vinculado a uma loja e não pode ser excluído.', status: 409 } as const;
    }
    throw falha;
  }
}
