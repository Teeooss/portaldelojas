import type { RouteObject } from 'react-router-dom';
import { RequirePermissao } from '../../core/permissions/require-permissao';
import { LojaDetalhePage } from './lojas-detalhe/lojas-detalhe';

export const lojasRoutes: RouteObject[] = [{
  element: <RequirePermissao chave="lojas.acessar"/>,
  children: [
    { path: 'lojas', lazy: async () => ({ Component: (await import('./lojas-list/lojas-list')).LojasListPage }) },
    { path: 'lojas/:id', element: <LojaDetalhePage/> },
    { element: <RequirePermissao chave="lojas.gravar.incluir"/>, children: [
      {
        path: 'lojas/nova',
        lazy: async () => ({ Component: (await import('./lojas-form/lojas-form')).LojaFormPage }),
      },
    ] },
  ],
}];
