import { erro, json, lerCorpo, type AppData, type Env } from '../../../server/core/http';
import { exigirPermissao } from '../../../server/core/permissao';
import { listarMunicipios, gravarMunicipio } from '../../../server/domains/municipios/municipios.service';

export const onRequestGet: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueio = exigirPermissao(ctx, 'municipios.acessar');
  if (bloqueio) return bloqueio;
  return json({ municipios: await listarMunicipios(ctx.env.LOJAS_DB) });
};

export const onRequestPost: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueio = exigirPermissao(ctx, 'municipios.acessar') ?? exigirPermissao(ctx, 'municipios.gravar.incluir');
  if (bloqueio) return bloqueio;
  const entrada = await lerCorpo<unknown>(ctx.request).catch(() => null);
  const resultado = await gravarMunicipio(ctx.env.LOJAS_DB, entrada);
  if (resultado.erro) return erro(resultado.erro, resultado.status);
  return json(resultado, 201);
};
