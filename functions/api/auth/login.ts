import { erro, json, lerCorpo, type Env } from '../../../server/core/http';
import { criarSessao } from '../../../server/core/sessao';
import { autenticarUsuario } from '../../../server/domains/usuarios/usuarios.service';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const entrada = await lerCorpo<unknown>(request).catch(() => null);
  const resultado = await autenticarUsuario(env.LOJAS_DB, entrada);
  if (!resultado) return erro('E-mail ou senha incorretos.', 401);
  if (resultado.status === 'Pendente') return erro('Seu cadastro está aguardando aprovação da administração.', 403);
  const { usuario } = resultado;
  const cookie = await criarSessao(env, usuario.id, request.headers.get('X-Device-Id'));
  return json({ usuario }, 200, cookie);
};
