export type PermissaoKey =
  | 'lojas.acessar'
  | 'lojas.gravar.incluir'
  | 'lojas.contato.visualizar'
  | 'municipios.acessar'
  | 'municipios.gravar.incluir'
  | 'municipios.gravar.editar'
  | 'municipios.apagar'
  | 'usuarios.acessar'
  | 'usuarios.gravar.editar';

export type PermissoesUsuario = Set<PermissaoKey>;
export interface NoArvorePermissao {
  label: string;
  chave?: PermissaoKey;
  filhos?: NoArvorePermissao[];
}
