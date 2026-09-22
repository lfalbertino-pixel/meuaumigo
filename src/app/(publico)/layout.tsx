import Link from 'next/link';
import { Marca } from '@/components/Marca';
import { lerSessao } from '@/lib/auth';
import { lerConfiguracao } from '@/server/config';

const LINKS = [
  { href: '/animais', rotulo: 'Encontre seu AUmigo' },
  { href: '/campanhas', rotulo: 'Campanhas' },
  { href: '/impacto', rotulo: 'Transparência' },
];

export default async function LayoutPublico({ children }: { children: React.ReactNode }) {
  const [sessao, config] = await Promise.all([lerSessao(), lerConfiguracao()]);
  const destinoLogado = sessao?.padrinhoId ? '/meus-aumigos' : '/painel';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-tinta-borda bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Marca />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação do site">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-tinta-suave transition hover:bg-petroleo-50 hover:text-petroleo-800"
              >
                {l.rotulo}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {sessao ? (
              <Link href={destinoLogado} className="botao-secundario">
                {sessao.padrinhoId ? 'Meus AUmigos' : 'Painel'}
              </Link>
            ) : (
              <Link href="/entrar" className="botao-fantasma hidden sm:inline-flex">
                Entrar
              </Link>
            )}
            <Link href="/animais?apadrinhamento=precisa" className="botao-doar">
              Apadrinhar
            </Link>
          </div>
        </div>

        {/* No celular os links viram uma tira sob o cabeçalho: o menu
            sanduíche esconderia justamente as três páginas que convertem. */}
        <nav
          className="flex gap-1 overflow-x-auto border-t border-tinta-borda/70 px-4 py-1.5 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Navegação do site"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold text-tinta-suave"
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-tinta-borda bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <Marca />
            <p className="mt-3 max-w-xs text-sm text-tinta-suave">{config.frase}</p>
          </div>

          <div>
            <h2 className="titulo-seccao">Navegue</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-tinta-suave hover:text-petroleo-800">
                    {l.rotulo}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/entrar" className="text-tinta-suave hover:text-petroleo-800">
                  Área do padrinho
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="titulo-seccao">Fale com a gente</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-tinta-suave">
              {config.email ? <li>{config.email}</li> : null}
              {config.telefone ? <li>{config.telefone}</li> : null}
              {config.cidade ? (
                <li>
                  {config.cidade}
                  {config.estado ? ` — ${config.estado}` : ''}
                </li>
              ) : null}
              {config.cnpj ? <li className="text-xs text-tinta-clara">CNPJ {config.cnpj}</li> : null}
            </ul>
          </div>
        </div>
        <div className="border-t border-tinta-borda/70 px-4 py-4 text-center text-xs text-tinta-clara">
          {config.nome} · feito para quem fica até o animal ficar bem
        </div>
      </footer>
    </div>
  );
}
