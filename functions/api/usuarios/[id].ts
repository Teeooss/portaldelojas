import { erro, json, lerCorpo, type Env, type AppData } from '../../../server/core/http';
import { exigirPermissao } from '../../../server/core/permissao';
import { atualizarUsuario, validarAlteracao } from '../../../server/domains/usuarios/usuarios.service';

export const onRequestPut: PagesFunction<Env, string, AppData> = async (ctx) => {
  const bloqueio = exigirPermissao(ctx, 'usuarios.acessar') ?? exigirPermissao(ctx, 'usuarios.gravar.editar');
  if (bloqueio || !ctx.data.usuario) return bloqueio ?? erro('Faça login para continuar.', 401);
  const dados = validarAlteracao(await lerCorpo<unknown>(ctx.request).catch(() => null));
  if (!dados) return erro('Confira a situação e as permissões.');
  const resposta = await atualizarUsuario(ctx.env.LOJAS_DB, String(ctx.params.id), ctx.data.usuario, dados);
  return resposta.usuario ? json(resposta) : erro(resposta.erro, resposta.status);
};
