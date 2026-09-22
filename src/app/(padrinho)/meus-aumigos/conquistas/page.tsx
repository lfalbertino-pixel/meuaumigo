import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cartao, TituloPagina } from '@/components/ui';
import { exigirPadrinho } from '@/lib/auth';
import { formatarData, tempoDesde } from '@/lib/format';
import { carregarMeusAumigos } from '@/server/padrinho';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Conquistas', robots: { index: false, follow: false } };

export default async function Conquistas() {
  const usuario = await exigirPadrinho();
  const dados = await carregarMeusAumigos(usuario.padrinhoId);
  if (!dados) notFound();

  const ativos = dados.apadrinhamentos.filter((a) => a.status === 'ATIVO');

  return (
    <>
      <TituloPagina
        titulo="Tempo de amizade 🐾"
        descricao="Não é um jogo e não tem ranking. É só um jeito de lembrar há quanto tempo você está do lado de alguém."
      />

      {ativos.length > 0 ? (
        <section className="mb-6 grid gap-3 sm:grid-cols-2">
          {ativos.map((a) => (
            <Cartao key={a.id} className="border-laranja-200 bg-laranja-50/50">
              <p className="text-sm text-tinta-suave">
                {dados.padrinho.nome.split(' ')[0]} é AUmigo do{' '}
                <Link
                  href={`/meus-aumigos/${a.animal.slug}`}
                  className="font-extrabold text-petroleo-900 hover:text-laranja-700"
                >
                  {a.animal.nome}
                </Link>{' '}
                há
              </p>
              <p className="mt-1 text-2xl font-extrabold text-laranja-700">
                {tempoDesde(a.inicio)} ❤️
              </p>
              <p className="mt-0.5 text-xs text-tinta-clara">desde {formatarData(a.inicio)}</p>
            </Cartao>
          ))}
        </section>
      ) : null}

      <h2 className="titulo-seccao mb-3">Suas conquistas</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dados.conquistas.map((c) => (
          <li key={c.codigo}>
            <Cartao className={`h-full ${c.conquistada ? '' : 'opacity-70'}`}>
              <span className={`text-3xl ${c.conquistada ? '' : 'grayscale'}`} aria-hidden>
                {c.emoji}
              </span>
              <h3 className="mt-2 font-extrabold text-petroleo-900">{c.titulo}</h3>
              <p className="mt-0.5 text-sm text-tinta-suave">{c.descricao}</p>

              {c.conquistada ? (
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-emerald-700">
                  ✓ conquistada
                </p>
              ) : (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-tinta-borda">
                    <div
                      className="h-full rounded-full bg-petroleo-400"
                      style={{ width: `${c.progresso}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-tinta-clara">
                    {Math.round(c.progresso)}% do caminho
                  </p>
                </div>
              )}
            </Cartao>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-caixa bg-petroleo-900 px-6 py-7 text-center text-white">
        <p className="text-lg font-extrabold">
          Obrigado por ficar. É o tempo que muda a vida de um animal, não o valor.
        </p>
        <Link href="/animais?apadrinhamento=precisa" className="botao-doar mt-4">
          Conhecer mais um AUmigo
        </Link>
      </div>
    </>
  );
}
