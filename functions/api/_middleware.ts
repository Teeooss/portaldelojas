import { erro, type AppData, type Env } from '../../server/core/http';
import { validarSessao } from '../../server/core/sessao';

export const onRequest: PagesFunction<Env, string, AppData> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const metodo = ctx.request.method;
  if (metodo !== 'GET' && metodo !== 'HEAD') {
    const origem = ctx.request.headers.get('Origin');
    if (origem !== url.origin) return erro('Origem da solicitação inválida.', 403);
  }
  const publica = metodo === 'POST' && ['/api/auth/login', '/api/auth/cadastro'].includes(url.pathname);
  const sair = metodo === 'POST' && url.pathname === '/api/auth/logout';

  try {
    if (!publica && !sair) {
      const usuario = await validarSessao(ctx.env, ctx.request);
      if (!usuario) return erro('Faça login para continuar.', 401);
      ctx.data.usuario = usuario;
    }
    return await ctx.next();
  } catch (falha) {
    console.error(falha);
    return erro('Não foi possível concluir a solicitação.', 500);
  }
};
