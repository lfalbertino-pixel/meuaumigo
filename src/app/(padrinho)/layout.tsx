import { Marca } from '@/components/Marca';
import { MenuLateral, MenuMobile } from '@/components/Navegacao';
import { BarraUsuario } from '@/components/BarraUsuario';
import { exigirPadrinho } from '@/lib/auth';

export default async function LayoutPadrinho({ children }: { children: React.ReactNode }) {
  const usuario = await exigirPadrinho();

  return (
    <div className="min-h-screen bg-tinta-fundo">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4 lg:px-6">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col lg:flex">
          <Marca href="/meus-aumigos" />
          <div className="mt-6 flex-1">
            <MenuLateral papel="PADRINHO" />
          </div>
          <BarraUsuario usuario={usuario} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <Marca compacta href="/meus-aumigos" />
            <BarraUsuario usuario={usuario} />
          </header>

          <div className="mb-4 lg:hidden">
            <MenuMobile papel="PADRINHO" />
          </div>

          <main className="animate-entra-tela pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
