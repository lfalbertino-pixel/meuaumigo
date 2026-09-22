import Link from 'next/link';
import { CartaoAnimalVitrine } from '@/components/CartaoAnimal';
import { BarraMeta } from '@/components/ui';
import { IconeCoracaoCheio, IconePata, IconeSaude, IconeSeta } from '@/components/Icones';
import { numero, porcento, reaisCurto } from '@/lib/format';
import { listarVitrine, listarCampanhasPublicas } from '@/server/publico';
import { carregarImpacto } from '@/server/painel';
import { lerConfiguracao } from '@/server/config';

export const dynamic = 'force-dynamic';

const PASSOS = [
  {
    Icone: IconePata,
    titulo: 'Resgate',
    texto: 'O animal chega machucado, doente ou abandonado. A partir daí, tudo dele fica registrado.',
  },
  {
    Icone: IconeCoracaoCheio,
    titulo: 'Apadrinhamento',
    texto: 'Você escolhe um AUmigo e assume uma parte do custo mensal dele. A partir de R$ 30.',
  },
  {
    Icone: IconeSaude,
    titulo: 'Cuidado',
    texto: 'Consulta, remédio, ração e castração — cada gasto entra na ficha daquele animal.',
  },
  {
    Icone: IconeSeta,
    titulo: 'Acompanhamento',
    texto: 'Você recebe as novidades: foto nova, consulta, melhora, e o dia em que ele for adotado.',
  },
];

export default async function Home() {
  const [precisam, campanhas, impacto, config] = await Promise.all([
    listarVitrine({ apadrinhamento: 'precisa' }),
    listarCampanhasPublicas(),
    carregarImpacto(),
    lerConfiguracao(),
  ]);

  const destaque = precisam.slice(0, 6);
  const campanhaUrgente = campanhas.find((c) => c.status === 'ATIVA');

  return (
    <>
      {/* ---------- Abertura ---------- */}
      <section className="patinhas border-b border-tinta-borda bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div className="animate-sobe">
              <span className="selo bg-laranja-100 text-laranja-800">
                🐾 {numero(impacto.resgatados)} animais resgatados até aqui
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-petroleo-900 sm:text-5xl">
                Você apadrinha.
                <br />
                A gente cuida.
                <br />
                <span className="text-laranja-500">E um AUmigo ganha uma nova chance.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-tinta-suave sm:text-lg">
                Cada animal daqui tem nome, história e uma conta que precisa fechar todo mês. Você
                escolhe um, assume uma parte desse custo — e acompanha, de perto, o que o seu apoio
                fez pela vida dele.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/animais?apadrinhamento=precisa" className="botao-doar px-7">
                  Quero apadrinhar um AUmigo
                </Link>
                <Link href="/impacto" className="botao-secundario">
                  Ver para onde vai o dinheiro
                </Link>
              </div>
            </div>

            {campanhaUrgente ? (
              <aside className="cartao animate-sobe border-laranja-200 bg-laranja-50/70 p-6">
                <span className="selo bg-laranja-500 text-white">🚨 Campanha de emergência</span>
                <h2 className="mt-3 text-xl font-extrabold text-petroleo-900">
                  {campanhaUrgente.titulo}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-tinta-suave">{campanhaUrgente.resumo}</p>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-extrabold tabular-nums text-laranja-700">
                      {reaisCurto(campanhaUrgente.arrecadado)}
                    </span>
                    <span className="tabular-nums text-tinta-suave">
                      de {reaisCurto(campanhaUrgente.meta)}
                    </span>
                  </div>
                  <BarraMeta
                    percentual={(campanhaUrgente.arrecadado / campanhaUrgente.meta) * 100}
                    altura="h-3"
                    rotulo={campanhaUrgente.titulo}
                  />
                  <p className="mt-1.5 text-xs font-semibold text-tinta-suave">
                    {porcento((campanhaUrgente.arrecadado / campanhaUrgente.meta) * 100)} da meta ·{' '}
                    {campanhaUrgente.doadores}{' '}
                    {campanhaUrgente.doadores === 1 ? 'pessoa ajudou' : 'pessoas ajudaram'}
                  </p>
                </div>

                <Link href={`/campanhas/${campanhaUrgente.slug}`} className="botao-doar mt-5 w-full">
                  ❤️ Quero ajudar
                </Link>
              </aside>
            ) : null}
          </div>
        </div>
      </section>

      {/* ---------- Como funciona ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="titulo-seccao">Como funciona</h2>
        <p className="mt-1 max-w-2xl text-2xl font-extrabold tracking-tight text-petroleo-900">
          Do resgate à adoção, sem nenhum passo escondido.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="cartao p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-petroleo-50 text-petroleo-700">
                <p.Icone tamanho={21} />
              </div>
              <h3 className="mt-3 text-base font-extrabold text-petroleo-900">
                <span className="text-tinta-clara">{i + 1}.</span> {p.titulo}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Quem ainda espera ---------- */}
      <section className="border-y border-tinta-borda bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="titulo-seccao">Ainda sem padrinho</h2>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-petroleo-900">
                {precisam.length === 0
                  ? 'Todos os nossos AUmigos têm padrinho 🎉'
                  : `${precisam.length} ${precisam.length === 1 ? 'AUmigo espera' : 'AUmigos esperam'} por alguém`}
              </p>
            </div>
            <Link href="/animais" className="botao-secundario">
              Ver todos os animais
            </Link>
          </div>

          {destaque.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destaque.map((animal, i) => (
                <CartaoAnimalVitrine key={animal.id} animal={animal} prioridade={i < 3} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------- Impacto ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="titulo-seccao">O que já foi feito</h2>
        <p className="mt-1 text-2xl font-extrabold tracking-tight text-petroleo-900">
          Números de gente que não desistiu.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { rotulo: 'Resgatados', valor: numero(impacto.resgatados), emoji: '🐶' },
            { rotulo: 'Apadrinhados', valor: numero(impacto.apadrinhados), emoji: '❤️' },
            { rotulo: 'Adotados', valor: numero(impacto.adotados), emoji: '🏡' },
            { rotulo: 'Tratamentos', valor: numero(impacto.tratamentos), emoji: '🏥' },
            { rotulo: 'Vacinas', valor: numero(impacto.vacinas), emoji: '💉' },
            { rotulo: 'Castrações', valor: numero(impacto.castracoes), emoji: '✂️' },
          ].map((n) => (
            <div key={n.rotulo} className="cartao p-4 text-center">
              <dd className="text-2xl font-extrabold tabular-nums text-petroleo-900">{n.valor}</dd>
              <dt className="mt-0.5 text-xs font-semibold text-tinta-suave">
                <span aria-hidden>{n.emoji}</span> {n.rotulo}
              </dt>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-caixa border border-petroleo-200 bg-petroleo-900 px-6 py-6 text-white">
          <div>
            <p className="text-sm font-semibold text-white/70">Destinado aos animais</p>
            <p className="text-3xl font-extrabold tabular-nums">
              {reaisCurto(impacto.totalDestinado)}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {numero(impacto.racaoKg)} kg de ração distribuídos · {numero(impacto.padrinhos)}{' '}
              padrinhos
            </p>
          </div>
          <Link
            href="/impacto"
            className="botao bg-white text-petroleo-900 hover:bg-laranja-100"
          >
            Ver a prestação de contas
          </Link>
        </div>
      </section>

      {/* ---------- Chamada final ---------- */}
      <section className="patinhas border-t border-tinta-borda bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-petroleo-900">
            {config.frase}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-tinta-suave">
            A partir de R$ 30 por mês você garante a ração de um AUmigo. E recebe, todo mês, a
            notícia de como ele está.
          </p>
          <Link href="/animais?apadrinhamento=precisa" className="botao-doar mt-7 px-8">
            Escolher meu AUmigo
          </Link>
        </div>
      </section>
    </>
  );
}
