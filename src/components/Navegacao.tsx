'use client';

import { usePathname } from 'next/navigation';
import Link from './Link';
import {
  IconeAjustes,
  IconeCasa,
  IconeCasaAdocao,
  IconeCoracao,
  IconeDinheiro,
  IconeDocumento,
  IconeGente,
  IconeGrafico,
  IconeIA,
  IconeMegafone,
  IconePata,
  IconeRacao,
  IconeSaude,
  type IconeProps,
} from './Icones';

type Item = {
  href: string;
  rotulo: string;
  Icone: (p: IconeProps) => React.JSX.Element;
  /** Só a direção vê. */
  admin?: boolean;
};

/**
 * A navegação da ONG segue o ciclo do animal, não o organograma da
 * equipe: resgate (Animais) → cuidado (Saúde, Alimentação) → sustento
 * (Apadrinhamentos, Padrinhos, Financeiro) → destino (Campanhas,
 * Adoções). Quem trabalha no abrigo pensa nessa ordem.
 */
const ITENS_ONG: Item[] = [
  { href: '/painel', rotulo: 'Painel', Icone: IconeCasa },
  { href: '/animais-ong', rotulo: 'Animais', Icone: IconePata },
  { href: '/apadrinhamentos', rotulo: 'Apadrinhamentos', Icone: IconeCoracao },
  { href: '/padrinhos', rotulo: 'Padrinhos', Icone: IconeGente },
  { href: '/saude', rotulo: 'Saúde', Icone: IconeSaude },
  { href: '/alimentacao', rotulo: 'Alimentação', Icone: IconeRacao },
  { href: '/financeiro', rotulo: 'Financeiro', Icone: IconeDinheiro, admin: true },
  { href: '/campanhas-ong', rotulo: 'Campanhas', Icone: IconeMegafone },
  { href: '/adocoes', rotulo: 'Adoções', Icone: IconeCasaAdocao },
  { href: '/relatorios', rotulo: 'Relatórios', Icone: IconeGrafico },
  { href: '/ia', rotulo: 'Meu AUmigo AI', Icone: IconeIA },
  { href: '/configuracoes', rotulo: 'Configurações', Icone: IconeAjustes, admin: true },
];

const ITENS_PADRINHO: Item[] = [
  { href: '/meus-aumigos', rotulo: 'Meus AUmigos', Icone: IconeCoracao },
  { href: '/meus-aumigos/contribuicoes', rotulo: 'Minhas contribuições', Icone: IconeDinheiro },
  { href: '/meus-aumigos/conquistas', rotulo: 'Conquistas', Icone: IconeDocumento },
  { href: '/animais', rotulo: 'Encontrar um AUmigo', Icone: IconePata },
];

function ativo(caminho: string, href: string) {
  if (href === '/meus-aumigos') return caminho === href;
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function MenuLateral({ papel }: { papel: string }) {
  const caminho = usePathname();
  const ehPadrinho = papel === 'PADRINHO';
  const itens = (ehPadrinho ? ITENS_PADRINHO : ITENS_ONG).filter(
    (i) => !i.admin || papel === 'ADMIN',
  );

  return (
    <nav aria-label="Navegação principal">
      <ul className="space-y-0.5">
        {itens.map((item) => {
          const marcado = ativo(caminho, item.href);
          const { Icone } = item;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={marcado ? 'page' : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200 ease-entrada ${
                  marcado
                    ? 'bg-petroleo-50 text-petroleo-800'
                    : 'text-tinta-suave hover:bg-tinta-fundo hover:text-tinta'
                }`}
              >
                {/* Barrinha que cresce do centro quando o item fica ativo. */}
                <span
                  aria-hidden
                  className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-laranja-500 transition-transform duration-200 ease-entrada ${
                    marcado ? 'scale-y-100' : 'scale-y-0'
                  }`}
                />
                <Icone tamanho={19} />
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * No celular a lateral vira uma tira rolável no topo. Não é uma barra
 * inferior de 5 abas porque a ONG tem 12 destinos — cortar para 5 e
 * esconder 7 num "mais" é pior do que deixar rolar.
 */
export function MenuMobile({ papel }: { papel: string }) {
  const caminho = usePathname();
  const ehPadrinho = papel === 'PADRINHO';
  const itens = (ehPadrinho ? ITENS_PADRINHO : ITENS_ONG).filter(
    (i) => !i.admin || papel === 'ADMIN',
  );

  return (
    <nav
      aria-label="Navegação principal"
      className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max gap-1.5">
        {itens.map((item) => {
          const marcado = ativo(caminho, item.href);
          const { Icone } = item;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={marcado ? 'page' : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                  marcado
                    ? 'border-petroleo-800 bg-petroleo-800 text-white'
                    : 'border-tinta-borda bg-white text-tinta-suave'
                }`}
              >
                <Icone tamanho={15} />
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
