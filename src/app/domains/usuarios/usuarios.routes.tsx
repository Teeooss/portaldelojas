import type { RouteObject } from 'react-router-dom';
import { RequirePermissao } from '../../core/permissions/require-permissao';

export const usuariosRoutes: RouteObject[] = [{
  element: <RequirePermissao chave="usuarios.acessar"/>,
  children: [{ path: 'usuarios', lazy: async () => ({ Component: (await import('./usuarios-list/usuarios-list')).UsuariosListPage }) }],
}];
