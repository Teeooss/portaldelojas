import { erro, type AppContext } from './http';
import type { PermissaoKey } from '../../src/app/core/permissions/permission.model';

export function exigirPermissao(ctx: AppContext, chave: PermissaoKey): Response | null {
  const usuario = ctx.data.usuario;
  if (!usuario) return erro('Faça login para continuar.', 401);
  if (!usuario.permissoes.includes(chave)) return erro('Você não tem permissão para esta ação.', 403);
  return null;
}
