import type { ReactNode } from 'react';

export function AuthSurface({ children }: { children: ReactNode }) {
  return <main className="surface-ground flex align-items-center justify-content-center min-h-screen p-3">
    <div className="portal-auth flex flex-column align-items-center">
      <div className="flex align-items-center gap-2 text-900 text-3xl font-medium mb-5">
        <i className="pi pi-shop text-primary" aria-hidden="true"/> Vitrine
      </div>
      <div className="portal-auth-frame w-full">
        <div className="portal-auth-card surface-card p-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  </main>;
}
