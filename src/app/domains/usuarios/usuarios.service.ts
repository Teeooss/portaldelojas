import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../../core/auth/api-client';
import type { Usuario } from './usuarios.model';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const recarregar = useCallback(async (signal?: AbortSignal) => {
    setCarregando(true);
    setErro('');
    try { setUsuarios((await apiFetch<{ usuarios: Usuario[] }>('/usuarios', { signal })).usuarios); }
    catch (falha) { if (!signal?.aborted) setErro(falha instanceof Error ? falha.message : 'Erro ao carregar usuários.'); }
    finally { if (!signal?.aborted) setCarregando(false); }
  }, []);
  useEffect(() => {
    const controle = new AbortController();
    void recarregar(controle.signal);
    return () => controle.abort();
  }, [recarregar]);

  async function atualizar(usuario: Usuario) {
    const { status, permissoes, versao } = usuario;
    const resposta = await apiFetch<{ usuario: Usuario }>(`/usuarios/${encodeURIComponent(usuario.id)}`, {
      method: 'PUT', body: JSON.stringify({ status, permissoes, versao }),
    });
    setUsuarios((lista) => lista.map((item) => item.id === usuario.id ? resposta.usuario : item));
  }
  return { usuarios, carregando, erro, atualizar, recarregar };
}
