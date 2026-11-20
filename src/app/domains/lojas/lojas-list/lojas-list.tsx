import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { Loja } from '../lojas.model';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { PageHeader } from '../../../shared/ui/page-header';
import { Permissao } from '../../../core/permissions/permissao';
import { useLojas } from '../lojas.service';

const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const POR_PAGINA = 12;
const normalizar = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function LojasListPage() {
  const { lojas, carregando, erro } = useLojas();
  const [busca, setBusca] = useState('');
  const [regiao, setRegiao] = useState('');
  const [ordem, setOrdem] = useState('nome');
  const [pagina, setPagina] = useState(1);
  const termo = normalizar(busca);
  const resultado = lojas.filter((loja) =>
    (!regiao || loja.regiao === regiao) &&
    normalizar(`${loja.nome} ${loja.cidade} ${loja.uf}`).includes(termo)
  ).sort((a, b) => ordem === 'cidade'
    ? a.cidade.localeCompare(b.cidade, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR')
    : a.nome.localeCompare(b.nome, 'pt-BR'));
  const visiveis = resultado.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return <>
    <PageHeader title="Lojas" description="Consulte as lojas por nome, cidade ou região.">
      <Permissao chave="lojas.gravar.incluir">
        <Link to="/lojas/nova" className="p-button p-component"><i className="pi pi-plus"/> Cadastrar loja</Link>
      </Permissao>
    </PageHeader>
    <section className="card" aria-label="Consulta de lojas">
      <div className="filter-toolbar">
        <label className="form-field"><span>Buscar loja</span><InputText type="search" placeholder="Nome ou cidade" value={busca} onChange={(evento) => { setBusca(evento.target.value); setPagina(1); }}/></label>
        <label className="form-field"><span>Região</span><select className="p-inputtext p-component" value={regiao} onChange={(evento) => { setRegiao(evento.target.value); setPagina(1); }}>
          <option value="">Todas as regiões</option>{REGIOES.map((nome) => <option key={nome}>{nome}</option>)}
        </select></label>
        <label className="form-field"><span>Ordenar por</span><select className="p-inputtext p-component" value={ordem} onChange={(evento) => { setOrdem(evento.target.value); setPagina(1); }}>
          <option value="nome">Nome da loja</option><option value="cidade">Cidade</option>
        </select></label>
      </div>
      {erro && <p className="inline-error" role="alert">{erro}</p>}
      {carregando && <p className="inline-loading" role="status">Carregando lojas…</p>}
      {!erro && !carregando && (visiveis.length ? <DataTable value={visiveis} dataKey="id" size="small" tableStyle={{ minWidth: '30rem' }}>
        <Column header="Loja" body={(loja: Loja) => <Link to={`/lojas/${loja.id}`} className="table-store">
          <span className="store-avatar" aria-hidden="true"><i className="pi pi-shop"/></span>
          <span><b>{loja.nome}</b><small>{loja.categoria}</small></span>
        </Link>}/>
        <Column header="Cidade e UF" body={(loja: Loja) => `${loja.cidade}, ${loja.uf}`}/>
        <Column field="regiao" header="Região"/>
      </DataTable> : <div className="empty-state"><h2>Nenhuma loja encontrada</h2><p>{busca || regiao ? 'Ajuste sua busca ou troque de região.' : 'Ainda não há lojas cadastradas.'}</p></div>)}
      {resultado.length > POR_PAGINA && <div className="pagination">
        <span>Página {pagina} de {Math.ceil(resultado.length / POR_PAGINA)}</span>
        <div><button className="p-button p-component p-button-outlined p-button-secondary" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <button className="p-button p-component p-button-outlined p-button-secondary" disabled={pagina * POR_PAGINA >= resultado.length} onClick={() => setPagina(pagina + 1)}>Próxima</button></div>
      </div>}
    </section>
  </>;
}
