import { erro, json, type AppData, type Env } from '../../../server/core/http';
import { exigirPermissao } from '../../../server/core/permissao';
import { obterLoja } from '../../../server/domains/lojas/lojas.service';

export const onRequestGet: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueio = exigirPermissao(ctx, 'lojas.acessar');
  if (bloqueio) return bloqueio;
  const incluirContato = !exigirPermissao(ctx, 'lojas.contato.visualizar');
  const loja = await obterLoja(ctx.env.LOJAS_DB, String(ctx.params.id), incluirContato);
  return loja ? json({ loja }) : erro('Loja não encontrada.', 404);
};
