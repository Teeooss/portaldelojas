import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { PageHeader } from '../../../shared/ui/page-header';
import { UFS } from '../municipios.model';
import { gravarMunicipio, obterMunicipio } from '../municipios.service';

export function MunicipioFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [uf, setUf] = useState('');
  const [carregando, setCarregando] = useState(Boolean(id));
  const [erroCarga, setErroCarga] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!id) return;
    const controle = new AbortController();
    setCarregando(true);
    setErroCarga('');
    obterMunicipio(id, controle.signal)
      .then((municipio) => {
        if (controle.signal.aborted) return;
        setNome(municipio.nome);
        setUf(municipio.uf);
      })
      .catch((falha: Error) => { if (!controle.signal.aborted) setErroCarga(falha.message); })
      .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
    return () => controle.abort();
  }, [id]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await gravarMunicipio({ nome, uf }, id);
      navigate('/municipios');
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar o município.');
    } finally {
      setSalvando(false);
    }
  }

  return <div className="form-page">
    <PageHeader title={id ? 'Editar município' : 'Cadastrar município'}>
      <Link to="/municipios" className="p-button p-component p-button-outlined p-button-secondary">Voltar aos municípios</Link>
    </PageHeader>
    {carregando && <p className="inline-loading" role="status">Carregando município…</p>}
    {erroCarga && <p className="inline-error" role="alert">{erroCarga}</p>}
    {!carregando && !erroCarga && <form className="card store-form" onSubmit={(evento) => void enviar(evento)}>
      <div className="form-grid">
        <label className="form-field"><span>Nome do município *</span>
          <InputText value={nome} onChange={(evento) => setNome(evento.target.value)} required maxLength={120}/>
        </label>
        <label className="form-field"><span>UF *</span><select className="p-inputtext p-component" value={uf} onChange={(evento) => setUf(evento.target.value)} required>
          <option value="" disabled>Selecione</option>
          {UFS.map((estado) => <option key={estado}>{estado}</option>)}
        </select></label>
      </div>
      {erro && <p className="form-error" role="alert">{erro}</p>}
      <div className="form-actions"><button type="submit" className="p-button p-component" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar município'}</button></div>
    </form>}
  </div>;
}
