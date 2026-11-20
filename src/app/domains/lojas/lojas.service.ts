import { useEffect, useState } from 'react';
import { apiFetch } from '../../core/auth/api-client';
import type { Loja, LojaPayload } from './lojas.model';

export function useLojas() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  useEffect(() => {
    let ativo = true;
    apiFetch<{ lojas: Loja[] }>('/lojas')
      .then((dados) => { if (ativo) setLojas(dados.lojas); })
      .catch((falha: Error) => { if (ativo) setErro(falha.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);
  return { lojas, carregando, erro };
}

export async function obterLoja(id: string) {
  return (await apiFetch<{ loja: Loja }>(`/lojas/${encodeURIComponent(id)}`)).loja;
}

export async function cadastrarLoja(dados: LojaPayload) {
  const resposta = await apiFetch<{ loja: Loja }>('/lojas', { method: 'POST', body: JSON.stringify(dados) });
  return resposta.loja;
}
