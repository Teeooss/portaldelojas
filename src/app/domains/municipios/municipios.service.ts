import { useEffect, useState } from 'react';
import { apiFetch } from '../../core/auth/api-client';
import type { MunicipioPayload, ReferenciaMunicipal } from './municipios.model';

export function useMunicipios(referencias = false) {
  const [municipios, setMunicipios] = useState<ReferenciaMunicipal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const controle = new AbortController();
    const rota = referencias ? '/municipios/referencias' : '/municipios';
    apiFetch<{ municipios: ReferenciaMunicipal[] }>(rota, { signal: controle.signal })
      .then((resposta) => { if (!controle.signal.aborted) setMunicipios(resposta.municipios); })
      .catch((falha: Error) => { if (!controle.signal.aborted) setErro(falha.message); })
      .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
    return () => controle.abort();
  }, [referencias]);

  return { municipios, carregando, erro, setMunicipios };
}

function rotaMunicipio(id: string) {
  return `/municipios/${encodeURIComponent(id)}`;
}

export async function obterMunicipio(id: string, signal: AbortSignal) {
  return (await apiFetch<{ municipio: ReferenciaMunicipal }>(rotaMunicipio(id), { signal })).municipio;
}

export async function gravarMunicipio(dados: MunicipioPayload, id?: string) {
  await apiFetch(id ? rotaMunicipio(id) : '/municipios', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(dados),
  });
}

export async function excluirMunicipio(id: string) {
  await apiFetch(rotaMunicipio(id), { method: 'DELETE' });
}
