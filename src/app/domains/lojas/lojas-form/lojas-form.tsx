import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { PageHeader } from '../../../shared/ui/page-header';
import { useReferenciasMunicipais } from '../../municipios/municipios.public';
import { cadastrarLoja } from '../lojas.service';
import type { LojaPayload } from '../lojas.model';

const CAMPOS = [
  { chave: 'nome', label: 'Nome da loja', obrigatorio: true },
  { chave: 'categoria', label: 'Categoria', obrigatorio: true },
  { chave: 'endereco', label: 'Endereço', obrigatorio: true },
  { chave: 'responsavel', label: 'Responsável' },
  { chave: 'telefone', label: 'Telefone' },
  { chave: 'email', label: 'E-mail' },
] as const;

export function LojaFormPage() {
  const navigate = useNavigate();
  const { municipios, carregando, erro: erroMunicipios } = useReferenciasMunicipais();
  const [municipioId, setMunicipioId] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    const ler = (campo: string) => String(form.get(campo) ?? '').trim();
    const dados: LojaPayload = {
      nome: ler('nome'), categoria: ler('categoria'), endereco: ler('endereco'),
      municipioId,
      responsavel: ler('responsavel'), telefone: ler('telefone'), email: ler('email'),
    };
    setErro('');
    setSalvando(true);
    try {
      const loja = await cadastrarLoja(dados);
      navigate(`/lojas/${loja.id}`);
    } catch (falha) { setErro(falha instanceof Error ? falha.message : 'Não foi possível cadastrar a loja.'); }
    finally { setSalvando(false); }
  }
  return <div className="form-page">
    <PageHeader title="Cadastrar loja"><Link to="/lojas" className="p-button p-component p-button-outlined p-button-secondary">Cancelar</Link></PageHeader>
    <form className="card store-form" onSubmit={(evento) => void enviar(evento)}>
      <div className="form-grid">
        {CAMPOS.slice(0, 3).map(({ chave, label }) => <label key={chave} className="form-field"><span>{label} *</span>
          <InputText name={chave} maxLength={160} required/>
        </label>)}
        <div className="form-field">
          <span id="loja-municipio-label">Município *</span>
          <Dropdown value={municipioId} onChange={(evento) => setMunicipioId(evento.value)}
            options={municipios.map((municipio) => ({ value: municipio.id, label: `${municipio.nome} (${municipio.uf})` }))}
            placeholder={carregando ? 'Carregando municípios…' : 'Selecione um município'}
            filter filterPlaceholder="Buscar por município ou UF" disabled={carregando || !!erroMunicipios || !municipios.length}
            aria-labelledby="loja-municipio-label"/>
        </div>
      </div>
      {erroMunicipios && <p className="form-error" role="alert">{erroMunicipios}</p>}
      {!carregando && !erroMunicipios && !municipios.length &&
        <p role="status">Cadastre um município antes de incluir uma loja.</p>}
      <h2 className="form-contact-heading">Contato principal <small>(opcional)</small></h2>
      <div className="form-grid">
        {CAMPOS.slice(3).map(({ chave, label }) => <label key={chave} className="form-field"><span>{label}</span>
          <InputText name={chave} maxLength={160} type={chave === 'email' ? 'email' : chave === 'telefone' ? 'tel' : 'text'}/>
        </label>)}
      </div>
      {erro && <p className="form-error" role="alert">{erro}</p>}
      <div className="form-actions"><button type="submit" className="p-button p-component" disabled={salvando || !municipioId || !!erroMunicipios}>{salvando ? 'Salvando…' : 'Salvar loja'}</button></div>
    </form>
  </div>;
}
