import type { Metadata } from 'next';
import Link from 'next/link';
import { GraficoBarras, GraficoDonut } from '@/components/Graficos';
import { CORES, corDaCategoria } from '@/lib/paleta';
import { Cartao } from '@/components/ui';
import { CATEGORIA_DESPESA, formatarData, numero, reais, reaisCurto } from '@/lib/format';
import { carregarImpacto } from '@/server/painel';
import { carregarTransparencia } from '@/server/transparencia';
import { lerConfiguracao } from '@/server/config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Transparência e impacto',
  description:
    'Quanto entrou, em que foi gasto e com que comprovante. A prestação de contas do Meu AUmigo, aberta.',
};

const TIPO_COMPROVANTE: Record<string, string> = {
  NOTA_FISCAL: '📄 Nota fiscal',
  RECIBO: '📄 Recibo',
  CUPOM: '🧾 Cupom',
  CONTRATO: '📑 Contrato',
  OUTRO: '📄 Documento',
};

export default async function Impacto() {
  const [impacto, transparencia, config] = await Promise.all([
    carregarImpacto(),
    carregarTransparencia(12),
    lerConfiguracao(),
  ]);

  const numeros = [
    { rotulo: 'animais resgatados', valor: numero(impacto.resgatados), emoji: '🐶' },
    { rotulo: 'animais apadrinhados', valor: numero(impacto.apadrinhados), emoji: '❤️' },
    { rotulo: 'animais adotados', valor: numero(impacto.adotados), emoji: '🏠' },
    { rotulo: 'tratamentos realizados', valor: numero(impacto.tratamentos), emoji: '🏥' },
    { rotulo: 'vacinas aplicadas', valor: numero(impacto.vacinas), emoji: '💉' },
    { rotulo: 'castrações', valor: numero(impacto.castracoes), emoji: '✂️' },
    { rotulo: 'kg de ração distribuídos', valor: numero(impacto.racaoKg), emoji: '🍖' },
    { rotulo: 'destinados aos animais', valor: reaisCurto(impacto.totalDestinado), emoji: '💰' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-petroleo-900 sm:text-4xl">
          Onde o seu dinheiro está sendo usado
        </h1>
        <p className="mt-2 max-w-2xl text-tinta-suave">
          Quem apadrinha tem direito de saber o destino de cada real. Esta página mostra o que
          entrou, no que foi gasto e com que comprovante — atualizada junto com o lançamento.
        </p>
      </header>

      {/* ---------- Impacto acumulado ---------- */}
      <section>
        <h2 className="titulo-seccao">❤️ Impacto do {config.nome}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {numeros.map((n) => (
            <div key={n.rotulo} className="cartao p-4">
              <dd className="text-2xl font-extrabold tabular-nums text-petroleo-900">{n.valor}</dd>
              <dt className="mt-0.5 text-xs font-semibold leading-snug text-tinta-suave">
                <span aria-hidden>{n.emoji}</span> {n.rotulo}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Entradas e saídas ---------- */}
      <section className="mt-10 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Cartao>
          <h2 className="titulo-seccao">Entradas e saídas, mês a mês</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            Nos últimos 12 meses entraram {reaisCurto(transparencia.totalEntrada)} e saíram{' '}
            {reaisCurto(transparencia.totalSaida)} em cuidado com os animais.
          </p>
          <div className="mt-4">
            <GraficoBarras
              dados={transparencia.serie}
              series={[
                { chave: 'entrada', rotulo: 'Arrecadado', cor: CORES.entrada },
                { chave: 'saida', rotulo: 'Gasto com os animais', cor: CORES.saida },
              ]}
            />
          </div>
        </Cartao>

        <Cartao>
          <h2 className="titulo-seccao">Em que foi gasto</h2>
          <p className="mt-1 text-sm text-tinta-suave">Distribuição das despesas nos 12 meses.</p>
          <div className="mt-4">
            <GraficoDonut
              titulo="Despesas por categoria"
              dados={transparencia.porCategoria.map((c) => ({
                rotulo: CATEGORIA_DESPESA[c.categoria as keyof typeof CATEGORIA_DESPESA] ?? c.categoria,
                valor: c.valor,
                cor: corDaCategoria(c.categoria),
              }))}
            />
          </div>
        </Cartao>
      </section>

      {/* ---------- Comprovantes ---------- */}
      <section className="mt-10">
        <h2 className="titulo-seccao">Comprovantes publicados</h2>
        <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
          Nota fiscal de ração, recibo de veterinário, compra de medicamento. Publicamos os
          documentos que comprovam o uso dos recursos — sem expor dados de terceiros.
        </p>

        {transparencia.comprovantes.length === 0 ? (
          <p className="mt-4 text-sm text-tinta-clara">Nenhum comprovante publicado ainda.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {transparencia.comprovantes.map((c) => (
              <li key={c.id}>
                <a
                  href={`/api/comprovante/${c.id}`}
                  target="_blank"
                  rel="noopener"
                  className="cartao flex h-full flex-col p-4 transition hover:border-petroleo-300 hover:shadow-flutuante"
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-tinta-clara">
                    {TIPO_COMPROVANTE[c.tipo] ?? '📄 Documento'}
                  </span>
                  <span className="mt-1 font-bold leading-snug text-petroleo-900">{c.titulo}</span>
                  <span className="mt-1 text-xs text-tinta-suave">
                    {formatarData(c.despesa.data)}
                    {c.despesa.fornecedor ? ` · ${c.despesa.fornecedor}` : ''}
                  </span>
                  <span className="mt-auto pt-3 text-sm font-extrabold tabular-nums text-petroleo-800">
                    {reais(c.despesa.valor)}
                    {c.despesa.animal ? (
                      <span className="ml-2 text-xs font-semibold text-laranja-700">
                        🐾 {c.despesa.animal.nome}
                      </span>
                    ) : null}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-12 rounded-caixa bg-petroleo-900 px-6 py-8 text-center text-white">
        <h2 className="text-2xl font-extrabold">{config.frase}</h2>
        <Link href="/animais?apadrinhamento=precisa" className="botao-doar mt-5">
          Apadrinhar um AUmigo
        </Link>
      </div>
    </div>
  );
}
