import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useAuth } from '../auth/auth.service';
import { MENU_PRINCIPAL } from '../navegacao/navegacao.model';

export function Shell() {
  const { usuario, logout, temPermissao } = useAuth();
  const location = useLocation();
  const [menuDesktop, setMenuDesktop] = useState(true);
  const [menuMobile, setMenuMobile] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => { setMenuMobile(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuMobile) return;
    const fechar = (evento: KeyboardEvent) => { if (evento.key === 'Escape') setMenuMobile(false); };
    document.body.classList.add('blocked-scroll');
    document.addEventListener('keydown', fechar);
    return () => {
      document.body.classList.remove('blocked-scroll');
      document.removeEventListener('keydown', fechar);
    };
  }, [menuMobile]);

  function alternarMenu() {
    if (window.matchMedia('(max-width: 991px)').matches) setMenuMobile((aberto) => !aberto);
    else setMenuDesktop((aberto) => !aberto);
  }
  async function sair() {
    try { await logout(); }
    catch { setErro('Não foi possível sair. Tente novamente.'); }
  }

  const classe = `layout-wrapper layout-static ${menuDesktop ? '' : 'layout-static-inactive'} ${menuMobile ? 'layout-mobile-active' : ''}`;
  return <div className={classe}>
    <header className="layout-topbar">
      <Link to="/" className="layout-topbar-logo" onClick={() => setMenuMobile(false)}>
        <i className="pi pi-shop mr-2" aria-hidden="true"/> <span>Vitrine</span>
      </Link>
      <button type="button" className="p-link layout-menu-button layout-topbar-button"
        onClick={alternarMenu} aria-controls="portal-menu" aria-label="Alternar navegação">
        <i className="pi pi-bars" aria-hidden="true"/>
      </button>
      <div className="portal-topbar-account">
        <span className="portal-topbar-name">{usuario?.nome}</span>
        <Button icon="pi pi-sign-out" text rounded aria-label="Sair" title="Sair" onClick={() => void sair()}/>
      </div>
    </header>

    <aside className="layout-sidebar" id="portal-menu">
      <nav aria-label="Navegação principal">
        <ul className="layout-menu">{MENU_PRINCIPAL.map((secao) => {
          const modulos = secao.grupos.flatMap((grupo) => grupo.modulos)
            .filter((modulo) => temPermissao(modulo.acesso));
          if (!modulos.length) return null;
          return <li key={secao.titulo} className="layout-root-menuitem">
            <div className="layout-menuitem-root-text">{secao.titulo}</div>
            <ul>{modulos.map((modulo) => <li key={modulo.rota}>
              <NavLink to={modulo.rota} onClick={() => setMenuMobile(false)}
                className={({ isActive }) => isActive ? 'active-route' : undefined}>
                <i className={`layout-menuitem-icon pi pi-${modulo.icone}`} aria-hidden="true"/>
                <span className="layout-menuitem-text">{modulo.label}</span>
              </NavLink>
            </li>)}</ul>
          </li>;
        })}</ul>
      </nav>
    </aside>

    <main className="layout-main-container">
      <div className="layout-main">{erro && <p className="inline-error" role="alert">{erro}</p>}<Outlet/></div>
    </main>
    <button type="button" className="layout-mask" aria-label="Fechar navegação" onClick={() => setMenuMobile(false)}/>
  </div>;
}
