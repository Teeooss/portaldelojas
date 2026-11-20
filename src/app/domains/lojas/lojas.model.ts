export interface Loja {
  id: string;
  nome: string;
  categoria: string;
  municipioId: string;
  cidade: string;
  uf: string;
  regiao: string;
  endereco: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
}
export type LojaPayload = Omit<Loja, 'id' | 'cidade' | 'uf' | 'regiao'>;
