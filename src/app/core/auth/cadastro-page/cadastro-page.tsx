import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { AuthSurface } from '../auth-surface';
import { useAuth } from '../auth.service';

export function CadastroPage() {
  const { usuario, carregando, cadastro } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pendente, setPendente] = useState(false);
  if (usuario) return <Navigate to="/" replace/>;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await cadastro({ nome, email, senha });
      setSenha('');
      setPendente(true);
    } catch (falha) { setErro(falha instanceof Error ? falha.message : 'Não foi possível criar a conta.'); }
    finally { setEnviando(false); }
  }

  if (pendente) return <AuthSurface>
    <h1>Cadastro pendente</h1>
    <p role="status">Seu pedido foi enviado. Você poderá entrar quando a administração aprovar seu acesso.</p>
    <Link className="p-button p-component" to="/login">Voltar ao login</Link>
  </AuthSurface>;

  return <AuthSurface>
    <h1 className="text-center mb-2">Criar conta</h1>
    <p className="text-center text-600 mb-4">Seu acesso precisa ser aprovado pela administração.</p>
    <form className="auth-form" onSubmit={(evento) => void enviar(evento)}>
      <label className="form-field" htmlFor="cadastro-nome"><span>Nome</span>
        <InputText id="cadastro-nome" value={nome} onChange={(evento) => setNome(evento.target.value)} required maxLength={100} autoComplete="name"/>
      </label>
      <label className="form-field" htmlFor="cadastro-email"><span>E-mail</span>
        <InputText id="cadastro-email" value={email} onChange={(evento) => setEmail(evento.target.value)} type="email" required autoComplete="email"/>
      </label>
      <label className="form-field" htmlFor="cadastro-senha"><span>Senha (mínimo 8 caracteres)</span>
        <Password inputId="cadastro-senha" value={senha} onChange={(evento) => setSenha(evento.target.value)} minLength={8} maxLength={128} feedback={false} toggleMask required autoComplete="new-password"/>
      </label>
      {erro && <p role="alert" className="form-error">{erro}</p>}
      <Button type="submit" label="Solicitar acesso" loading={enviando} disabled={carregando} className="w-full"/>
    </form>
    <p className="auth-signup"><Link to="/login">Voltar ao login</Link></p>
  </AuthSurface>;
}
