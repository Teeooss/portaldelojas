import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../../shared/ui/page-header';
import { Permissao } from '../../../core/permissions/permissao';
import type { Loja } from '../lojas.model';
import { obterLoja } from '../lojas.service';

export function LojaDetalhePage() {
  const { id = '' } = useParams();
  const [loja, setLoja] = useState<Loja>();
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  useEffect(() => {
    let ativo = true;
    setLoja(undefined);
    setErro('');
    obterLoja(id).then((dados) => { if (ativo) setLoja(dados); })
      .catch((falha: Error) => { if (ativo) setErro(falha.message); });
    return () => { ativo = false; };
  }, [id]);
  const contatos = [loja?.responsavel, loja?.telefone, loja?.email].filter(Boolean);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(contatos.join('\n'));
      setMensagem('Contato copiado.');
    } catch { setMensagem('Não foi possível copiar o contato.'); }
  }
  return <>
    <PageHeader title={loja?.nome ?? 'Detalhes da loja'} description={loja?.categoria}>
      <Link to="/lojas" className="p-button p-component p-button-outlined p-button-secondary"><i className="pi pi-arrow-left"/> Voltar às lojas</Link>
    </PageHeader>
    {erro && <p className="inline-error" role="alert">{erro}</p>}
    {!erro && !loja && <p className="inline-loading" role="status">Carregando loja…</p>}
    {loja && <section className="card detail-main detail-fields">
      <div><h2>Localização</h2><span>{loja.endereco}</span><span>{loja.cidade}, {loja.uf} · {loja.regiao}</span></div>
      <Permissao chave="lojas.contato.visualizar">
        <div><h2>Contato principal</h2>{contatos.length ? <>
          {contatos.map((contato, indice) => <span key={indice}>{contato}</span>)}
          <button className="p-button p-component p-button-outlined p-button-secondary" onClick={() => void copiar()}><i className="pi pi-copy"/> Copiar contato</button>
          <span role="status">{mensagem}</span>
        </> : <span>Contatos ainda não informados.</span>}</div>
      </Permissao>
    </section>}
  </>;
}
