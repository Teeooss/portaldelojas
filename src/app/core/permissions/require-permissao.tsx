import { Navigate, Outlet } from 'react-router-dom';
import type { PermissaoKey } from './permission.model';
import { usePermissao } from './permissao';

export function RequirePermissao({ chave }: { chave: PermissaoKey }) {
  return usePermissao(chave) ? <Outlet /> : <Navigate to="/sem-acesso" replace />;
}
