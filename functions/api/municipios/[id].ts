import { erro, json, lerCorpo, type AppData, type Env } from '../../../server/core/http';
import { exigirPermissao } from '../../../server/core/permissao';
import { obterMunicipio, gravarMunicipio, excluirMunicipio } from '../../../server/domains/municipios/municipios.service';

export const onRequestGet: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueio = exigirPermissao(ctx, 'municipios.acessar');
  if (bloqueio) return bloqueio;
  const municipio = await obterMunicipio(ctx.env.LOJAS_DB, String(ctx.params.id));
  return municipio ? json({ municipio }) : erro('Município não encontrado.', 404);
};

export const onRequestPut: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueio = exigirPermissao(ctx, 'municipios.acessar') ?? exigirPermissao(ctx, 'municipios.gravar.editar');
  if (bloqueio) return bloqueio;
  const entrada = await lerCorpo<unknown>(ctx.request).catch(() => null);
  const resultado = await gravarMunicipio(ctx.env.LOJAS_DB, entrada, String(ctx.params.id));
  return resultado.erro ? erro(resultado.erro, resultado.status) : json(resultado);
};

export const onRequestDelete: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueio = exigirPermissao(ctx, 'municipios.acessar') ?? exigirPermissao(ctx, 'municipios.apagar');
  if (bloqueio) return bloqueio;
  const resultado = await excluirMunicipio(ctx.env.LOJAS_DB, String(ctx.params.id));
  return resultado.erro ? erro(resultado.erro, resultado.status) : new Response(null, { status: 204 });
};
