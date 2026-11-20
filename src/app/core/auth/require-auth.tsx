import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth.service';

export function RequireAuth() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="loading-screen"><span className="text-primary"><i className="pi pi-shop" /></span><span>Preparando seu espaço...</span></div>;
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}
