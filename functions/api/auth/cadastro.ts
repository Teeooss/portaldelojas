import { erro, json, lerCorpo, type Env } from '../../../server/core/http';
import { cadastrarUsuario } from '../../../server/domains/usuarios/usuarios.service';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const entrada = await lerCorpo<unknown>(request).catch(() => null);
  try {
    const cadastro = await cadastrarUsuario(env.LOJAS_DB, entrada);
    if (!cadastro) return erro('Confira nome, e-mail e senha (mínimo de 8 caracteres).');
    return json(cadastro, 201);
  } catch (falha) {
    if (falha instanceof Error && falha.message.includes('UNIQUE')) return erro('Este e-mail já possui uma conta.', 409);
    throw falha;
  }
};
