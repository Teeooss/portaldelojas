import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from './core/auth/require-auth';
import { Shell } from './core/layout/shell';
import { InicioPortal } from './core/layout/inicio-portal';
import { LoginPage } from './core/auth/login-page/login-page';
import { CadastroPage } from './core/auth/cadastro-page/cadastro-page';
import { lojasRoutes } from './domains/lojas/lojas.routes';
import { municipiosRoutes } from './domains/municipios/municipios.routes';
import { usuariosRoutes } from './domains/usuarios/usuarios.routes';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage/> },
  { path: '/cadastro', element: <CadastroPage/> },
  { element: <RequireAuth/>, hydrateFallbackElement: <p className="loading-screen" role="status">Carregando portal…</p>, children: [{ element: <Shell/>, children: [
    { index: true, element: <InicioPortal/> },
    ...lojasRoutes,
    ...municipiosRoutes,
    ...usuariosRoutes,
    { path: 'sem-acesso', element: <div className="empty-state" role="alert"><h2>Acesso restrito</h2><p>Peça à administração para revisar suas permissões.</p></div> },
    { path: '*', element: <Navigate to="/" replace/> },
  ] }] },
]);
