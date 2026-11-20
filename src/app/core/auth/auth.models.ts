import type { PermissaoKey } from '../permissions/permission.model';

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  permissoes: PermissaoKey[];
}

export interface LoginPayload { email: string; senha: string }
export interface CadastroPayload { nome: string; email: string; senha: string }
export interface SessaoResponse { usuario: UsuarioLogado }
