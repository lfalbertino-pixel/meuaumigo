import { Marca } from '@/components/Marca';
import { MenuLateral, MenuMobile } from '@/components/Navegacao';
import { BarraUsuario } from '@/components/BarraUsuario';
import { exigirEquipe } from '@/lib/auth';

export default async function LayoutOng({ children }: { children: React.ReactNode }) {
  const usuario = await exigirEquipe();

  return (
    <div className="min-h-screen bg-tinta-fundo">
      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-4 lg:px-6">
        {/* Coluna fixa no desktop. No celular ela some e a navegação vira
            a tira rolável logo abaixo do cabeçalho. */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col lg:flex">
          <Marca href="/painel" />
          <div className="mt-6 flex-1 overflow-y-auto">
            <MenuLateral papel={usuario.papel} />
          </div>
          <BarraUsuario usuario={usuario} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <Marca compacta href="/painel" />
            <BarraUsuario usuario={usuario} />
          </header>

          <div className="mb-4 lg:hidden">
            <MenuMobile papel={usuario.papel} />
          </div>

          <main className="animate-entra-tela pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
