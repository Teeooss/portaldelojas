import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useState, type FormEvent } from 'react';
import { InputText } from 'primereact/inputtext';
import { PageHeader } from '../../../shared/ui/page-header';
import { ARVORE_PERMISSOES } from '../../../core/navegacao/navegacao.model';
import type { NoArvorePermissao, PermissaoKey } from '../../../core/permissions/permission.model';
import { Permissao } from '../../../core/permissions/permissao';
import { useAuth } from '../../../core/auth/auth.service';
import type { StatusUsuario, Usuario } from '../usuarios.model';
import { useUsuarios } from '../usuarios.service';

const SITUACOES: StatusUsuario[] = ['Ativo', 'Pendente', 'Suspenso'];

function Matriz({ nos, marcadas, marcar }: { nos: NoArvorePermissao[]; marcadas: PermissaoKey[]; marcar: (chave: PermissaoKey, valor: boolean) => void }) {
  return <ul className="permission-tree">{nos.map(({ label, chave, filhos }) => <li key={label}>
    {chave ? <label><input type="checkbox" checked={marcadas.includes(chave)} onChange={(evento) => marcar(chave, evento.target.checked)}/> {label}</label>
      : <><b>{label}</b>{filhos && <Matriz nos={filhos} marcadas={marcadas} marcar={marcar}/>}</>}
  </li>)}</ul>;
}

export function UsuariosListPage() {
  const { usuario: sessao } = useAuth();
  const { usuarios, carregando, erro, atualizar, recarregar } = useUsuarios();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('');
  const [edicao, setEdicao] = useState<Usuario>();
  const [salvando, setSalvando] = useState(false);
  const [falha, setFalha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const aprovando = edicao?.status === 'Ativo' &&
    usuarios.some((usuario) => usuario.id === edicao.id && usuario.status === 'Pendente');
  const visiveis = usuarios.filter((usuario) =>
    (!filtro || usuario.status === filtro) &&
    `${usuario.nome} ${usuario.email}`.toLowerCase().includes(busca.trim().toLowerCase())
  );

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!edicao) return;
    setFalha('');
    setSalvando(true);
    try {
      await atualizar(edicao);
      setEdicao(undefined);
      setMensagem(aprovando ? 'Acesso aprovado.' : 'Acesso atualizado.');
    }
    catch (causa) { setFalha(causa instanceof Error ? causa.message : 'Não foi possível salvar.'); }
    finally { setSalvando(false); }
  }
  function abrirAcesso(usuario: Usuario) {
    setEdicao(usuario.status === 'Pendente' ? { ...usuario, status: 'Ativo' } : usuario);
    setFalha('');
    setMensagem('');
  }
  function marcar(chave: PermissaoKey, valor: boolean) {
    setEdicao((atual) => atual && ({
      ...atual, permissoes: valor ? [...atual.permissoes, chave] : atual.permissoes.filter((item) => item !== chave),
    }));
  }

  return <>
    <PageHeader title="Usuários" description="Gerencie o acesso e as permissões de cada pessoa."/>
    <section className="card">
      <div className="filter-toolbar">
        <label className="form-field"><span>Buscar usuário</span><InputText type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Nome ou e-mail"/></label>
        <label className="form-field"><span>Situação</span><select className="p-inputtext p-component" value={filtro} onChange={(evento) => setFiltro(evento.target.value)}><option value="">Todas</option>
          {SITUACOES.map((status) => <option key={status}>{status}</option>)}
        </select></label>
      </div>
      {mensagem && <p className="success-banner" role="status">{mensagem}</p>}
      {erro && <p className="inline-error" role="alert">{erro}</p>}
      {carregando && <p className="inline-loading">Carregando usuários…</p>}
      {!carregando && !erro && (visiveis.length ? <DataTable value={visiveis} dataKey="id" size="small" tableStyle={{ minWidth: '39rem' }}>
        <Column header="Nome e e-mail" body={(usuario: Usuario) => <div className="table-store"><span><b>{usuario.nome}</b><small>{usuario.email}</small></span></div>}/>
        <Column header="Situação" body={(usuario: Usuario) => <Tag value={usuario.status}
          severity={usuario.status === 'Ativo' ? 'success' : usuario.status === 'Pendente' ? 'warning' : 'danger'}/>}/>
        <Column header="Permissões" body={(usuario: Usuario) => usuario.permissoes.length}/>
        <Column header="Acesso" body={(usuario: Usuario) => sessao?.id === usuario.id ? 'Sua conta' : <Permissao chave="usuarios.gravar.editar">
          <Button type="button" onClick={() => abrirAcesso(usuario)} size="small" text
            aria-label={`${usuario.status === 'Pendente' ? 'Revisar' : 'Gerenciar'} acesso de ${usuario.nome}`}
            label={usuario.status === 'Pendente' ? 'Revisar cadastro' : 'Gerenciar'}/>
        </Permissao>}/>
      </DataTable> : <div className="empty-state"><h2>Nenhum usuário encontrado</h2></div>)}
    </section>
    {edicao && <form className="card store-form access-form" onSubmit={(evento) => void salvar(evento)}>
      <h2>Acesso de {edicao.nome}</h2>
      <label className="form-field"><span>Situação da conta</span><select className="p-inputtext p-component" disabled={salvando} value={edicao.status} onChange={(evento) => setEdicao({ ...edicao, status: evento.target.value as StatusUsuario })}>
        {SITUACOES.map((status) => <option key={status}>{status}</option>)}
      </select></label>
      <fieldset disabled={salvando}><legend>Permissões</legend><Matriz nos={ARVORE_PERMISSOES} marcadas={edicao.permissoes} marcar={marcar}/></fieldset>
      {falha && <p className="form-error" role="alert">{falha}</p>}
      <div className="form-actions">
        <button type="button" className="p-button p-component p-button-outlined p-button-secondary" onClick={() => { setEdicao(undefined); void recarregar(); }} disabled={salvando}>Cancelar</button>
        <button className="p-button p-component" disabled={salvando}>
          {salvando ? 'Salvando…' : aprovando ? 'Aprovar acesso' : 'Salvar acesso'}
        </button>
      </div>
    </form>}
  </>;
}
