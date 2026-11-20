export interface ReferenciaMunicipal {
  id: string;
  nome: string;
  uf: string;
  regiao: string;
}

export type MunicipioPayload = Pick<ReferenciaMunicipal, 'nome' | 'uf'>;
