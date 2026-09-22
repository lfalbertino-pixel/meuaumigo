'use client';

import { useId, useState } from 'react';
import { reais, reaisCurto } from '@/lib/format';
import { CORES } from '@/lib/paleta';

/**
 * Gráficos em SVG, escritos à mão.
 *
 * Nenhuma biblioteca de chart: são quatro formas, e qualquer pacote do
 * mercado traria 60 kB de JavaScript para o celular de quem só quer ver
 * quanto entrou no mês.
 *
 * A paleta passou pelo validador de contraste e de daltonismo (ΔE de par
 * adjacente acima de 13 em deuteranopia, ΔE normal acima de 22). Os dois
 * tons de aviso do validador — laranja e verde abaixo de 3:1 contra o
 * branco — são cobertos pelo alívio obrigatório: todo gráfico daqui traz
 * legenda com rótulo em texto e uma tabela equivalente embaixo. Cor nunca
 * é a única forma de ler um número.
 */


// ----------------------------------------------------------
// Peças comuns
// ----------------------------------------------------------

function Legenda({ itens }: { itens: { rotulo: string; cor: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5 text-xs font-semibold text-tinta-suave">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-[3px]"
            style={{ background: i.cor }}
          />
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}

/**
 * A tabela equivalente. Fica fechada para não competir com o gráfico,
 * mas existe sempre: é ela que atende leitor de tela, impressão em preto
 * e branco e a pessoa que só quer o número exato.
 */
function TabelaEquivalente({
  colunas,
  linhas,
}: {
  colunas: string[];
  linhas: (string | number)[][];
}) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-semibold text-petroleo-600 hover:text-petroleo-800">
        Ver os números
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[320px] text-xs">
          <thead>
            <tr className="border-b border-tinta-borda text-left text-tinta-suave">
              {colunas.map((c) => (
                <th key={c} className="py-1.5 pr-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta-borda/60">
            {linhas.map((linha, i) => (
              <tr key={i}>
                {linha.map((celula, j) => (
                  <td key={j} className={`py-1.5 pr-3 tabular-nums ${j === 0 ? 'text-tinta-suave' : 'font-semibold'}`}>
                    {celula}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Balao({ x, y, linhas }: { x: number; y: number; linhas: string[] }) {
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg bg-petroleo-900 px-2.5 py-1.5 text-[11px] font-semibold leading-snug text-white shadow-flutuante"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {linhas.map((l, i) => (
        <div key={i} className={i === 0 ? 'text-white/70' : ''}>
          {l}
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------
// Barras agrupadas — entrada x saída por mês
// ----------------------------------------------------------

export type PontoMensal = { rotulo: string; valores: Record<string, number> };

export function GraficoBarras({
  dados,
  series,
  formato = 'reais',
  altura = 190,
}: {
  dados: PontoMensal[];
  series: { chave: string; rotulo: string; cor: string }[];
  formato?: 'reais' | 'inteiro';
  altura?: number;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const id = useId();

  const fmt = (v: number) => (formato === 'reais' ? reaisCurto(v) : String(Math.round(v)));
  const maximo = Math.max(
    1,
    ...dados.flatMap((d) => series.map((s) => d.valores[s.chave] ?? 0)),
  );

  const L = 100; // largura do viewBox, em unidades
  const passo = L / Math.max(1, dados.length);
  const larguraGrupo = passo * 0.66;
  const larguraBarra = larguraGrupo / series.length;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${L} ${altura}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: altura }}
        role="img"
        aria-label={`Gráfico de barras: ${series.map((s) => s.rotulo).join(' e ')} por mês`}
      >
        {/* Grade recessiva: três linhas, nada mais. Ela orienta, não decora. */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2={L}
            y1={altura - altura * f * 0.86}
            y2={altura - altura * f * 0.86}
            stroke={CORES.grade}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {dados.map((d, i) => {
          const base = i * passo + (passo - larguraGrupo) / 2;
          return (
            <g key={`${id}-${i}`} onMouseEnter={() => setAtivo(i)} onMouseLeave={() => setAtivo(null)}>
              {/* Alvo de mouse do grupo inteiro: maior que as barras, para
                  que o balão não pisque entre uma barra e outra. */}
              <rect x={i * passo} y="0" width={passo} height={altura} fill="transparent" />
              {series.map((s, j) => {
                const valor = d.valores[s.chave] ?? 0;
                const h = Math.max(valor > 0 ? 3 : 0, (valor / maximo) * altura * 0.86);
                return (
                  <rect
                    key={s.chave}
                    // 2px de folga entre barras vizinhas: sem isso duas
                    // cores encostadas viram uma só à distância.
                    x={base + j * larguraBarra + 0.5}
                    y={altura - h}
                    width={Math.max(0.5, larguraBarra - 1)}
                    height={h}
                    rx="1.2"
                    fill={s.cor}
                    opacity={ativo === null || ativo === i ? 1 : 0.35}
                    style={{ transition: 'opacity 150ms' }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex" aria-hidden>
        {dados.map((d, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[10px] font-semibold uppercase ${
              ativo === i ? 'text-petroleo-800' : 'text-tinta-clara'
            }`}
          >
            {d.rotulo}
          </span>
        ))}
      </div>

      {ativo !== null ? (
        <Balao
          x={((ativo + 0.5) / dados.length) * 100}
          y={0}
          linhas={[
            dados[ativo].rotulo.toUpperCase(),
            ...series.map((s) => `${s.rotulo}: ${fmt(dados[ativo].valores[s.chave] ?? 0)}`),
          ]}
        />
      ) : null}

      <Legenda itens={series.map((s) => ({ rotulo: s.rotulo, cor: s.cor }))} />
      <TabelaEquivalente
        colunas={['Mês', ...series.map((s) => s.rotulo)]}
        linhas={dados.map((d) => [d.rotulo, ...series.map((s) => fmt(d.valores[s.chave] ?? 0))])}
      />
    </div>
  );
}

// ----------------------------------------------------------
// Linha — evolução de uma grandeza só
// ----------------------------------------------------------

export function GraficoLinha({
  dados,
  chave,
  rotulo,
  cor = CORES.entrada,
  formato = 'reais',
  altura = 170,
}: {
  dados: PontoMensal[];
  chave: string;
  rotulo: string;
  cor?: string;
  formato?: 'reais' | 'inteiro';
  altura?: number;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const fmt = (v: number) => (formato === 'reais' ? reaisCurto(v) : String(Math.round(v)));

  const valores = dados.map((d) => d.valores[chave] ?? 0);
  const maximo = Math.max(1, ...valores);
  const L = 100;
  const topo = altura * 0.12;
  const util = altura - topo - 6;

  const ponto = (i: number) => ({
    x: dados.length === 1 ? L / 2 : (i / (dados.length - 1)) * (L - 6) + 3,
    y: topo + util - (valores[i] / maximo) * util,
  });

  const caminho = valores.map((_, i) => {
    const p = ponto(i);
    return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(' ');

  const area = `${caminho} L${ponto(dados.length - 1).x.toFixed(2)},${altura} L${ponto(0).x.toFixed(2)},${altura} Z`;
  const gradiente = `grad-${chave}`;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${L} ${altura}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: altura }}
        role="img"
        aria-label={`Evolução de ${rotulo} por mês`}
      >
        <defs>
          <linearGradient id={gradiente} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={cor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.33, 0.66, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2={L}
            y1={topo + util - util * f}
            y2={topo + util - util * f}
            stroke={CORES.grade}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#${gradiente})`} />
        <path
          d={caminho}
          fill="none"
          stroke={cor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {dados.map((_, i) => {
          const p = ponto(i);
          return (
            <g key={i} onMouseEnter={() => setAtivo(i)} onMouseLeave={() => setAtivo(null)}>
              <rect x={p.x - L / dados.length / 2} y="0" width={L / dados.length} height={altura} fill="transparent" />
              {ativo === i ? (
                <>
                  <line x1={p.x} x2={p.x} y1={topo} y2={altura} stroke={CORES.grade} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                  {/* Anel branco: o ponto sobrevive por cima da área. */}
                  <circle cx={p.x} cy={p.y} r="2.4" fill={cor} stroke="#fff" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
                </>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex" aria-hidden>
        {dados.map((d, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[10px] font-semibold uppercase ${
              ativo === i ? 'text-petroleo-800' : 'text-tinta-clara'
            }`}
          >
            {d.rotulo}
          </span>
        ))}
      </div>

      {ativo !== null ? (
        <Balao
          x={((ativo + 0.5) / dados.length) * 100}
          y={0}
          linhas={[dados[ativo].rotulo.toUpperCase(), fmt(valores[ativo])]}
        />
      ) : null}

      <TabelaEquivalente
        colunas={['Mês', rotulo]}
        linhas={dados.map((d, i) => [d.rotulo, fmt(valores[i])])}
      />
    </div>
  );
}

// ----------------------------------------------------------
// Donut — composição de uma grandeza
// ----------------------------------------------------------

export function GraficoDonut({
  dados,
  titulo,
  total: totalForcado,
}: {
  dados: { rotulo: string; valor: number; cor: string }[];
  titulo?: string;
  total?: number;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const total = totalForcado ?? dados.reduce((s, d) => s + d.valor, 0);
  if (total <= 0) {
    return <p className="py-10 text-center text-sm text-tinta-clara">Sem lançamentos no período.</p>;
  }

  const R = 42;
  const circunferencia = 2 * Math.PI * R;
  let acumulado = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg viewBox="0 0 100 100" className="h-40 w-40" role="img" aria-label={titulo ?? 'Composição'}>
          <circle cx="50" cy="50" r={R} fill="none" stroke={CORES.grade} strokeWidth="13" />
          {dados.map((d, i) => {
            const fracao = d.valor / total;
            // 2 unidades de folga entre fatias: o anel branco por baixo
            // aparece e separa duas cores vizinhas sem precisar de borda.
            const traco = Math.max(0, fracao * circunferencia - 2);
            const offset = circunferencia * 0.25 - acumulado * circunferencia;
            acumulado += fracao;
            return (
              <circle
                key={d.rotulo}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={d.cor}
                strokeWidth={ativo === i ? 15 : 13}
                strokeDasharray={`${traco} ${circunferencia - traco}`}
                strokeDashoffset={offset}
                transform="rotate(-90 50 50)"
                opacity={ativo === null || ativo === i ? 1 : 0.35}
                style={{ transition: 'opacity 150ms, stroke-width 150ms' }}
                onMouseEnter={() => setAtivo(i)}
                onMouseLeave={() => setAtivo(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wide text-tinta-clara">
            {ativo === null ? 'Total' : dados[ativo].rotulo}
          </span>
          <span className="text-base font-extrabold tabular-nums text-petroleo-900">
            {reaisCurto(ativo === null ? total : dados[ativo].valor)}
          </span>
        </div>
      </div>

      {/* Legenda com valor: aqui ela substitui o rótulo direto na fatia,
          que a 40px de raio nunca caberia sem virar sopa de letra. */}
      <ul className="w-full space-y-1.5">
        {dados.map((d, i) => (
          <li
            key={d.rotulo}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition hover:bg-tinta-fundo"
            onMouseEnter={() => setAtivo(i)}
            onMouseLeave={() => setAtivo(null)}
          >
            <span className="flex items-center gap-2 text-tinta-suave">
              <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: d.cor }} />
              {d.rotulo}
            </span>
            <span className="tabular-nums font-semibold text-tinta">
              {reais(d.valor)}
              <span className="ml-1.5 text-xs font-normal text-tinta-clara">
                {Math.round((d.valor / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------
// Medidor — uma grandeza só, contra um teto (estoque de ração)
// ----------------------------------------------------------

export function Medidor({
  valor,
  teto,
  unidade = 'kg',
  cor = CORES.entrada,
}: {
  valor: number;
  teto: number;
  unidade?: string;
  cor?: string;
}) {
  const pct = teto > 0 ? Math.max(0, Math.min(100, (valor / teto) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-extrabold tabular-nums text-petroleo-900">
          {valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} {unidade}
        </span>
        <span className="text-xs font-semibold tabular-nums text-tinta-suave">{Math.round(pct)}%</span>
      </div>
      <div
        className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-tinta-borda"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor }} />
      </div>
    </div>
  );
}
