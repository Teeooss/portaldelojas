import type { RouteObject } from 'react-router-dom';
import { RequirePermissao } from '../../core/permissions/require-permissao';
import { MunicipioFormPage } from './municipios-form/municipios-form';

export const municipiosRoutes: RouteObject[] = [{
  element: <RequirePermissao chave="municipios.acessar"/>,
  children: [
    { path: 'municipios', lazy: async () => ({ Component: (await import('./municipios-list/municipios-list')).MunicipiosListPage }) },
    { element: <RequirePermissao chave="municipios.gravar.incluir"/>, children: [
      { path: 'municipios/novo', element: <MunicipioFormPage/> },
    ] },
    { element: <RequirePermissao chave="municipios.gravar.editar"/>, children: [
      { path: 'municipios/:id/editar', element: <MunicipioFormPage/> },
    ] },
  ],
}];
