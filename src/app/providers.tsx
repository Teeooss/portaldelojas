import type { ReactNode } from 'react';
import { addLocale, PrimeReactProvider } from 'primereact/api';
import { AuthProvider } from './core/auth/auth.service';

addLocale('pt-BR', {
  accept: 'Confirmar',
  reject: 'Cancelar',
  choose: 'Selecionar',
  clear: 'Limpar',
  emptyMessage: 'Nenhum registro encontrado',
  emptyFilterMessage: 'Nenhum resultado encontrado',
  aria: {
    close: 'Fechar',
    navigation: 'Navegação',
    prevPageLabel: 'Página anterior',
    nextPageLabel: 'Próxima página',
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return <PrimeReactProvider value={{ locale: 'pt-BR', ripple: false }}>
    <AuthProvider>{children}</AuthProvider>
  </PrimeReactProvider>;
}
