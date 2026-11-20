import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/auth.service';
import { MENU_PRINCIPAL } from '../navegacao/navegacao.model';

const modulos = MENU_PRINCIPAL.flatMap((secao) => secao.grupos.flatMap((grupo) => grupo.modulos));

export function InicioPortal() {
  const { temPermissao } = useAuth();
  const primeiroModulo = modulos.find((modulo) => temPermissao(modulo.acesso));
  return <Navigate to={primeiroModulo?.rota ?? '/sem-acesso'} replace />;
}
