import type { NoArvorePermissao, PermissaoKey } from '../permissions/permission.model';

type Acao = { label: string; chave: PermissaoKey };
type Modulo = { label: string; rota: string; icone: string; acoes: Acao[] };

export const ESTRUTURA_APP: { titulo: string; grupos: { titulo: string; modulos: Modulo[] }[] }[] = [
  { titulo: 'Portal', grupos: [
    { titulo: 'Operação', modulos: [{ label: 'Lojas', rota: '/lojas', icone: 'shop', acoes: [
      { label: 'Consultar lojas', chave: 'lojas.acessar' },
      { label: 'Cadastrar lojas', chave: 'lojas.gravar.incluir' },
      { label: 'Ver contatos', chave: 'lojas.contato.visualizar' },
    ] }] },
    { titulo: 'Cadastros', modulos: [{ label: 'Municípios', rota: '/municipios', icone: 'map-marker', acoes: [
      { label: 'Consultar municípios', chave: 'municipios.acessar' },
      { label: 'Cadastrar municípios', chave: 'municipios.gravar.incluir' },
      { label: 'Editar municípios', chave: 'municipios.gravar.editar' },
      { label: 'Excluir municípios', chave: 'municipios.apagar' },
    ] }] },
    { titulo: 'Administração', modulos: [{ label: 'Usuários', rota: '/usuarios', icone: 'users', acoes: [
      { label: 'Consultar usuários', chave: 'usuarios.acessar' },
      { label: 'Gerenciar permissões e situação', chave: 'usuarios.gravar.editar' },
    ] }] },
  ] },
];
export const MENU_PRINCIPAL = ESTRUTURA_APP.map(({ titulo, grupos }) => ({
  titulo,
  grupos: grupos.map((grupo) => ({
    ...grupo,
    modulos: grupo.modulos.map((modulo) => ({ ...modulo, acesso: modulo.acoes[0].chave })),
  })),
}));
export const ARVORE_PERMISSOES: NoArvorePermissao[] = ESTRUTURA_APP.flatMap(({ grupos }) =>
  grupos.map(({ titulo, modulos }) => ({
    label: titulo,
    filhos: modulos.map(({ label, acoes }) => ({ label, filhos: acoes })),
  })),
);
