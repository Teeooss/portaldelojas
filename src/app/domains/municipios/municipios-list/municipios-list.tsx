import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Permissao } from '../../../core/permissions/permissao';
import { PageHeader } from '../../../shared/ui/page-header';
import { UFS, type ReferenciaMunicipal } from '../municipios.model';
import { excluirMunicipio, useMunicipios } from '../municipios.service';

const POR_PAGINA = 12;
const normalizar = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function MunicipiosListPage() {
  const { municipios, carregando, erro, setMunicipios } = useMunicipios();
  const [busca, setBusca] = useState('');
  const [uf, setUf] = useState('');
  const [pagina, setPagina] = useState(1);
  const [selecao, setSelecao] = useState<ReferenciaMunicipal>();
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');
  const [mensagem, setMensagem] = useState('');

  const termo = normalizar(busca);
  const filtrados = municipios.filter((municipio) => (!uf || municipio.uf === uf) && normalizar(municipio.nome).includes(termo));
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  async function excluir() {
    if (!selecao) return;
    setExcluindo(true);
    setErroExclusao('');
    try {
      await excluirMunicipio(selecao.id);
      setMunicipios((atual) => atual.filter((municipio) => municipio.id !== selecao.id));
      setSelecao(undefined);
      setMensagem('Município excluído.');
    } catch (falha) {
      setErroExclusao(falha instanceof Error ? falha.message : 'Não foi possível excluir o município.');
    } finally {
      setExcluindo(false);
    }
  }

  return <>
    <PageHeader title="Municípios" description="Consulte os municípios usados no cadastro de lojas.">
      <Permissao chave="municipios.gravar.incluir">
        <Link to="/municipios/novo" className="p-button p-component">Cadastrar município</Link>
      </Permissao>
    </PageHeader>
    {mensagem && <p className="success-banner" role="status">{mensagem}</p>}
    {selecao && <section className="card store-form access-form" aria-label="Confirmar exclusão">
      <h2>Excluir {selecao.nome} ({selecao.uf})?</h2>
      {erroExclusao && <p className="form-error" role="alert">{erroExclusao}</p>}
      <div className="form-actions">
        <button type="button" className="p-button p-component p-button-outlined p-button-secondary" onClick={() => setSelecao(undefined)} disabled={excluindo}>Cancelar</button>
        <button type="button" className="p-button p-component" onClick={() => void excluir()} disabled={excluindo}>Confirmar exclusão</button>
      </div>
    </section>}
    <section className="card" aria-label="Consulta de municípios">
      <div className="filter-toolbar">
        <label className="form-field"><span>Buscar município</span><InputText type="search" value={busca} onChange={(evento) => { setBusca(evento.target.value); setPagina(1); }}/></label>
        <label className="form-field"><span>UF</span><select className="p-inputtext p-component" value={uf} onChange={(evento) => { setUf(evento.target.value); setPagina(1); }}>
          <option value="">Todas</option>
          {UFS.map((estado) => <option key={estado}>{estado}</option>)}
        </select></label>
      </div>
      {erro && <p className="inline-error" role="alert">{erro}</p>}
      {carregando && <p className="inline-loading" role="status">Carregando municípios…</p>}
      {!erro && !carregando && (visiveis.length ? <DataTable value={visiveis} dataKey="id" size="small" tableStyle={{ minWidth: '35rem' }}>
        <Column field="nome" header="Município"/>
        <Column field="uf" header="UF"/>
        <Column field="regiao" header="Região"/>
        <Column header="Ações" body={(municipio: ReferenciaMunicipal) => <div className="table-actions">
          <Permissao chave="municipios.gravar.editar">
            <Link to={`/municipios/${municipio.id}/editar`} className="p-button p-component p-button-text p-button-sm"
              aria-label={`Editar ${municipio.nome} (${municipio.uf})`}>Editar</Link>
          </Permissao>
          <Permissao chave="municipios.apagar">
            <Button label="Excluir" text severity="danger" size="small" disabled={excluindo}
              aria-label={`Excluir ${municipio.nome} (${municipio.uf})`}
              onClick={() => { setSelecao(municipio); setErroExclusao(''); setMensagem(''); }}/>
          </Permissao>
        </div>}/>
      </DataTable> : <div className="empty-state"><h2>Nenhum município encontrado</h2></div>)}
      {totalPaginas > 1 && <div className="pagination">
        <span>Página {paginaAtual} de {totalPaginas}</span>
        <div><button className="p-button p-component p-button-outlined p-button-secondary" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</button>
          <button className="p-button p-component p-button-outlined p-button-secondary" disabled={paginaAtual === totalPaginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</button></div>
      </div>}
    </section>
  </>;
}
