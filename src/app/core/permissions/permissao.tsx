import type { ReactNode } from 'react';
import type { PermissaoKey } from './permission.model';
import { useAuth } from '../auth/auth.service';

export function usePermissao(chave: PermissaoKey) { return useAuth().temPermissao(chave); }
export function Permissao({ chave, children }: { chave: PermissaoKey; children: ReactNode }) {
  return usePermissao(chave) ? <>{children}</> : null;
}
