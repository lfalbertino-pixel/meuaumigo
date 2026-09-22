import type { Metadata } from 'next';
import Link from 'next/link';
import { FotoAnimal } from '@/components/FotoAnimal';
import { BarraMeta, Cartao, Selo, Vazio } from '@/components/ui';
import { formatarData, porcento, reaisCurto } from '@/lib/format';
import { listarCampanhasPublicas } from '@/server/publico';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Campanhas',
  description:
    'Cirurgias, tratamentos e emergências que não podem esperar o apadrinhamento mensal fechar.',
};

export default async function Campanhas() {
  const campanhas = await listarCampanhasPublicas();
  const ativas = campanhas.filter((c) => c.status === 'ATIVA');
  const concluidas = campanhas.filter((c) => c.status === 'CONCLUIDA');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-petroleo-900 sm:text-4xl">
          Campanhas 🚨
        </h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          Tem coisa que não espera o mês virar. Cirurgia, tratamento caro, resgate de urgência — é
          para isso que existem as campanhas.
        </p>
      </header>

      {ativas.length === 0 ? (
        <Vazio
          emoji="🎉"
          titulo="Nenhuma campanha aberta agora"
          descricao="Isso é uma boa notícia: significa que nenhum AUmigo está com uma emergência descoberta."
          acao={
            <Link href="/animais" className="botao-doar">
              Apadrinhar um AUmigo
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {ativas.map((c) => {
            const pct = (c.arrecadado / c.meta) * 100;
            return (
              <Cartao key={c.id} padding={false} className="overflow-hidden">
                {c.animal ? (
                  <Link href={`/animais/${c.animal.slug}`} className="block aspect-[16/9] bg-tinta-borda">
                    <FotoAnimal
                      fotoId={c.animal.fotoCapaId}
                      nome={c.animal.nome}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                ) : null}

                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {c.urgente ? <Selo classe="bg-rose-600 text-white">🚨 Urgente</Selo> : null}
                    {c.prazo ? (
                      <Selo classe="bg-tinta-borda text-tinta-suave">
                        até {formatarData(c.prazo)}
                      </Selo>
                    ) : null}
                  </div>

                  <h2 className="mt-2.5 text-xl font-extrabold text-petroleo-900">{c.titulo}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">{c.resumo}</p>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-extrabold tabular-nums text-laranja-700">
                        {reaisCurto(c.arrecadado)}
                      </span>
                      <span className="tabular-nums text-tinta-suave">
                        meta {reaisCurto(c.meta)}
                      </span>
                    </div>
                    <BarraMeta percentual={pct} altura="h-3" rotulo={c.titulo} />
                    <p className="mt-1.5 text-xs font-semibold text-tinta-suave">
                      {porcento(pct)} · {c.doadores}{' '}
                      {c.doadores === 1 ? 'pessoa ajudou' : 'pessoas ajudaram'}
                    </p>
                  </div>

                  <Link href={`/campanhas/${c.slug}`} className="botao-doar mt-4 w-full">
                    ❤️ Quero ajudar
                  </Link>
                </div>
              </Cartao>
            );
          })}
        </div>
      )}

      {concluidas.length > 0 ? (
        <section className="mt-12">
          <h2 className="titulo-seccao">Campanhas que deram certo</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {concluidas.map((c) => (
              <li key={c.id}>
                <Cartao className="h-full">
                  <Selo classe="bg-emerald-100 text-emerald-800">🎉 Meta atingida</Selo>
                  <h3 className="mt-2 font-extrabold text-petroleo-900">{c.titulo}</h3>
                  <p className="mt-1 text-sm text-tinta-suave">
                    {reaisCurto(c.arrecadado)} arrecadados com {c.doadores} apoiadores.
                  </p>
                </Cartao>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
