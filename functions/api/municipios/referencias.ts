import { json, type AppData, type Env } from '../../../server/core/http';
import { exigirPermissao } from '../../../server/core/permissao';
import { listarReferenciasMunicipais } from '../../../server/domains/municipios/municipios.public';

export const onRequestGet: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueioMunicipios = exigirPermissao(ctx, 'municipios.acessar');
  if (bloqueioMunicipios) {
    const bloqueioLojas = exigirPermissao(ctx, 'lojas.acessar') ?? exigirPermissao(ctx, 'lojas.gravar.incluir');
    if (bloqueioLojas) return bloqueioLojas;
  }
  return json({ municipios: await listarReferenciasMunicipais(ctx.env.LOJAS_DB) });
};
