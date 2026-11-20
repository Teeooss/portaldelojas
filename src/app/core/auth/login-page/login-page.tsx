import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { AuthSurface } from '../auth-surface';
import { useAuth } from '../auth.service';

export function LoginPage() {
  const { usuario, carregando, login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  if (usuario) return <Navigate to="/" replace/>;

  async function submit(evento: FormEvent) {
    evento.preventDefault();
    setErro('');
    setEnviando(true);
    try { await login({ email, senha }); }
    catch (falha) { setErro(falha instanceof Error ? falha.message : 'Não foi possível entrar.'); }
    finally { setEnviando(false); }
  }

  return <AuthSurface>
    <h1 className="text-center mb-4">Entrar no portal</h1>
    <form className="auth-form" onSubmit={(evento) => void submit(evento)}>
      <label className="form-field" htmlFor="login-email"><span>E-mail</span>
        <InputText id="login-email" type="email" required autoComplete="email" value={email} onChange={(evento) => setEmail(evento.target.value)}/>
      </label>
      <label className="form-field" htmlFor="login-senha"><span>Senha</span>
        <Password inputId="login-senha" value={senha} required feedback={false} toggleMask autoComplete="current-password" onChange={(evento) => setSenha(evento.target.value)}/>
      </label>
      {erro && <p className="form-error" role="alert">{erro}</p>}
      <Button type="submit" label="Entrar" loading={enviando} disabled={carregando} className="w-full"/>
    </form>
    <p className="auth-signup"><Link to="/cadastro">Criar conta</Link></p>
  </AuthSurface>;
}
