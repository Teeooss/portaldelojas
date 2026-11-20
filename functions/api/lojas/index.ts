import { erro, json, lerCorpo, type AppData, type Env } from '../../../server/core/http';
import { exigirPermissao } from '../../../server/core/permissao';
import { cadastrarLoja, listarLojas, validarLoja } from '../../../server/domains/lojas/lojas.service';

export const onRequestGet: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueio = exigirPermissao(ctx, 'lojas.acessar');
  if (bloqueio) return bloqueio;
  return json({ lojas: await listarLojas(ctx.env.LOJAS_DB) });
};

export const onRequestPost: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueio = exigirPermissao(ctx, 'lojas.acessar') ?? exigirPermissao(ctx, 'lojas.gravar.incluir');
  if (bloqueio) return bloqueio;
  const dados = validarLoja(await lerCorpo<unknown>(ctx.request).catch(() => null));
  if (!dados) return erro('Confira os dados da loja e selecione um município.');
  const loja = await cadastrarLoja(ctx.env.LOJAS_DB, dados);
  return loja ? json({ loja }, 201) : erro('O município selecionado não está disponível.', 409);
};
