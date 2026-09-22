import type { Metadata } from 'next';
import Link from 'next/link';
import { CartaoAnimalVitrine } from '@/components/CartaoAnimal';
import { Vazio } from '@/components/ui';
import { IconeBusca } from '@/components/Icones';
import { listarVitrine, type FiltroVitrine } from '@/server/publico';
import type { Especie, Porte, Sexo } from '@prisma/client';
import type { FaixaEtaria } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Encontre seu AUmigo',
  description:
    'Conheça os animais resgatados que esperam por um padrinho. Filtre por porte, idade, sexo e necessidade especial.',
};

type Busca = Record<string, string | string[] | undefined>;

function texto(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() ? s.trim() : undefined;
}

/**
 * Os filtros são links, não JavaScript.
 *
 * Isso é deliberado: cada combinação vira uma URL que a ONG pode mandar
 * no Instagram ("os filhotes que precisam de padrinho") e que o buscador
 * consegue indexar. Um filtro que só existe no estado do React não pode
 * ser compartilhado — e compartilhar é justamente como esta página
 * arruma padrinho novo.
 */
const GRUPOS: { titulo: string; parametro: string; opcoes: { valor: string; rotulo: string }[] }[] = [
  {
    titulo: 'Apadrinhamento',
    parametro: 'apadrinhamento',
    opcoes: [
      { valor: 'precisa', rotulo: 'Precisa de padrinho' },
      { valor: 'apadrinhado', rotulo: 'Já tem padrinho' },
    ],
  },
  {
    titulo: 'Sexo',
    parametro: 'sexo',
    opcoes: [
      { valor: 'MACHO', rotulo: 'Macho' },
      { valor: 'FEMEA', rotulo: 'Fêmea' },
    ],
  },
  {
    titulo: 'Idade',
    parametro: 'faixa',
    opcoes: [
      { valor: 'FILHOTE', rotulo: 'Filhote' },
      { valor: 'ADULTO', rotulo: 'Adulto' },
      { valor: 'IDOSO', rotulo: 'Idoso' },
    ],
  },
  {
    titulo: 'Porte',
    parametro: 'porte',
    opcoes: [
      { valor: 'PEQUENO', rotulo: 'Pequeno' },
      { valor: 'MEDIO', rotulo: 'Médio' },
      { valor: 'GRANDE', rotulo: 'Grande' },
    ],
  },
  {
    titulo: 'Espécie',
    parametro: 'especie',
    opcoes: [
      { valor: 'CANINA', rotulo: 'Cachorro' },
      { valor: 'FELINA', rotulo: 'Gato' },
    ],
  },
  {
    titulo: 'Outros',
    parametro: 'especial',
    opcoes: [
      { valor: '1', rotulo: 'Necessidade especial' },
      { valor: 'adocao', rotulo: 'Disponível para adoção' },
    ],
  },
];

function montarUrl(busca: Busca, parametro: string, valor: string): string {
  const params = new URLSearchParams();
  for (const [chave, v] of Object.entries(busca)) {
    const s = texto(v);
    if (s && chave !== parametro) params.set(chave, s);
  }
  // Clicar no filtro já aplicado desliga: o mesmo alvo liga e desliga,
  // e ninguém precisa procurar um "limpar" separado.
  if (texto(busca[parametro]) !== valor) params.set(parametro, valor);
  const qs = params.toString();
  return qs ? `/animais?${qs}` : '/animais';
}

export default async function Vitrine({ searchParams }: { searchParams: Promise<Busca> }) {
  const busca = await searchParams;

  const especial = texto(busca.especial);
  const filtro: FiltroVitrine = {
    busca: texto(busca.q),
    especie: texto(busca.especie) as Especie | undefined,
    sexo: texto(busca.sexo) as Sexo | undefined,
    porte: texto(busca.porte) as Porte | undefined,
    faixa: texto(busca.faixa) as FaixaEtaria | undefined,
    necessidadeEspecial: especial === '1' || undefined,
    adocao: especial === 'adocao' || undefined,
    apadrinhamento: texto(busca.apadrinhamento) as 'precisa' | 'apadrinhado' | undefined,
  };

  const animais = await listarVitrine(filtro);
  const temFiltro = Object.values(busca).some((v) => texto(v));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-7">
        <h1 className="text-3xl font-extrabold tracking-tight text-petroleo-900 sm:text-4xl">
          Encontre seu AUmigo 🐾
        </h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          Cada um deles tem uma história e uma conta que precisa fechar todo mês. Escolha por quem
          você quer começar.
        </p>
      </header>

      <form method="get" action="/animais" className="mb-5 flex gap-2">
        {/* Os filtros ativos viajam junto com a busca: buscar "thor" não
            pode apagar o filtro de "precisa de padrinho". */}
        {Object.entries(busca).map(([chave, valor]) =>
          chave !== 'q' && texto(valor) ? (
            <input key={chave} type="hidden" name={chave} value={texto(valor)} />
          ) : null,
        )}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-clara">
            <IconeBusca tamanho={18} />
          </span>
          <input
            type="search"
            name="q"
            defaultValue={texto(busca.q) ?? ''}
            placeholder="Buscar por nome, raça ou história"
            className="campo pl-10"
            aria-label="Buscar animal"
          />
        </div>
        <button type="submit" className="botao-primario">
          Buscar
        </button>
      </form>

      <div className="mb-8 space-y-3">
        {GRUPOS.map((grupo) => (
          <div key={grupo.parametro} className="flex flex-wrap items-center gap-2">
            <span className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide text-tinta-clara">
              {grupo.titulo}
            </span>
            {grupo.opcoes.map((opcao) => {
              const ativo = texto(busca[grupo.parametro]) === opcao.valor;
              return (
                <Link
                  key={opcao.valor}
                  href={montarUrl(busca, grupo.parametro, opcao.valor)}
                  aria-pressed={ativo}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    ativo
                      ? 'border-petroleo-800 bg-petroleo-800 text-white'
                      : 'border-tinta-borda bg-white text-tinta-suave hover:border-petroleo-300 hover:text-petroleo-700'
                  }`}
                >
                  {opcao.rotulo}
                </Link>
              );
            })}
          </div>
        ))}

        {temFiltro ? (
          <Link href="/animais" className="inline-block text-xs font-bold text-laranja-600 hover:underline">
            Limpar filtros
          </Link>
        ) : null}
      </div>

      <p className="mb-4 text-sm font-semibold text-tinta-suave" role="status">
        {animais.length} {animais.length === 1 ? 'AUmigo encontrado' : 'AUmigos encontrados'}
      </p>

      {animais.length === 0 ? (
        <Vazio
          titulo="Nenhum AUmigo com esses filtros"
          descricao="Tente afrouxar a busca — talvez o próximo grande amigo esteja só a um filtro de distância."
          acao={
            <Link href="/animais" className="botao-secundario">
              Ver todos
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {animais.map((animal, i) => (
            <CartaoAnimalVitrine key={animal.id} animal={animal} prioridade={i < 6} />
          ))}
        </div>
      )}
    </div>
  );
}
