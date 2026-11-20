import type { MunicipioPayload } from '../../../contracts/municipios.public';

const REGIOES_POR_UF = {
  AC: 'Norte',
  AP: 'Norte',
  AM: 'Norte',
  PA: 'Norte',
  RO: 'Norte',
  RR: 'Norte',
  TO: 'Norte',
  AL: 'Nordeste',
  BA: 'Nordeste',
  CE: 'Nordeste',
  MA: 'Nordeste',
  PB: 'Nordeste',
  PE: 'Nordeste',
  PI: 'Nordeste',
  RN: 'Nordeste',
  SE: 'Nordeste',
  DF: 'Centro-Oeste',
  GO: 'Centro-Oeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  ES: 'Sudeste',
  MG: 'Sudeste',
  RJ: 'Sudeste',
  SP: 'Sudeste',
  PR: 'Sul',
  RS: 'Sul',
  SC: 'Sul',
} as const;

const LETRAS: Record<string, string> = {"Á":"a","À":"a","Â":"a","Ã":"a","Ä":"a","á":"a","à":"a","â":"a","ã":"a","ä":"a","É":"e","È":"e","Ê":"e","Ë":"e","é":"e","è":"e","ê":"e","ë":"e","Í":"i","Ì":"i","Î":"i","Ï":"i","í":"i","ì":"i","î":"i","ï":"i","Ó":"o","Ò":"o","Ô":"o","Õ":"o","Ö":"o","ó":"o","ò":"o","ô":"o","õ":"o","ö":"o","Ú":"u","Ù":"u","Û":"u","Ü":"u","ú":"u","ù":"u","û":"u","ü":"u","Ç":"c","ç":"c","Ñ":"n","ñ":"n"};

export function lerMunicipio(entrada: unknown) {
  if (!entrada || typeof entrada !== 'object') return null;
  const { nome, uf } = entrada as Partial<MunicipioPayload>;
  const nomeLimpo = typeof nome === 'string' ? nome.trim().normalize('NFC') : '';
  const estado = typeof uf === 'string' ? uf.trim().toUpperCase() : '';
  if (!nomeLimpo || nomeLimpo.length > 120 || !/\p{L}/u.test(nomeLimpo)) return null;
  if (!Object.hasOwn(REGIOES_POR_UF, estado)) return null;
  const regiao = REGIOES_POR_UF[estado as keyof typeof REGIOES_POR_UF];
  const nomeChave = nomeLimpo.replace(/[^\x00-\x7F]/g, (letra) => LETRAS[letra] ?? letra)
    .replace(/[A-Z]/g, (letra) => letra.toLowerCase());
  return { nome: nomeLimpo, uf: estado, regiao, nomeChave };
}
