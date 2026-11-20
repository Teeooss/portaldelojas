import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CadastroPayload, LoginPayload, SessaoResponse, UsuarioLogado } from './auth.models';
import type { PermissaoKey } from '../permissions/permission.model';
import { apiFetch } from './api-client';

interface AuthContextValue {
  usuario: UsuarioLogado | null;
  carregando: boolean;
  temPermissao: (chave: PermissaoKey) => boolean;
  login: (payload: LoginPayload) => Promise<void>;
  cadastro: (payload: CadastroPayload) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let ativo = true;
    const encerrar = () => setUsuario(null);
    window.addEventListener('sessao-expirada', encerrar);
    apiFetch<SessaoResponse>('/auth/me')
      .then((dados) => { if (ativo) setUsuario(dados.usuario); })
      .catch(() => { if (ativo) setUsuario(null); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => {
      ativo = false;
      window.removeEventListener('sessao-expirada', encerrar);
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const resultado = await apiFetch<SessaoResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    setUsuario(resultado.usuario);
  }, []);
  const cadastro = useCallback(async (payload: CadastroPayload) => {
    await apiFetch('/auth/cadastro', { method: 'POST', body: JSON.stringify(payload) });
  }, []);
  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUsuario(null);
  }, []);
  const permissoes = useMemo(() => new Set(usuario?.permissoes), [usuario]);
  const temPermissao = useCallback((chave: PermissaoKey) => permissoes.has(chave), [permissoes]);
  return <AuthContext.Provider value={{ usuario, carregando, temPermissao, login, cadastro, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.');
  return context;
}
