import type { PermissaoKey } from '../../core/permissions/permission.model';
export type StatusUsuario = 'Ativo' | 'Pendente' | 'Suspenso';
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  status: StatusUsuario;
  permissoes: PermissaoKey[];
  versao: number;
}
