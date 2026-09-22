import type { ReactNode } from 'react';

/**
 * As peças repetidas do sistema. Tudo aqui é servidor puro — nenhum
 * componente desta lista precisa de estado, e componente com 'use client'
 * desnecessário empurra JavaScript para um celular em 4G.
 */

export function Cartao({
  children,
  className = '',
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return <div className={`cartao ${padding ? 'p-5' : ''} ${className}`}>{children}</div>;
}

export function TituloPagina({
  titulo,
  descricao,
  acao,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-petroleo-900 sm:text-3xl">
          {titulo}
        </h1>
        {descricao ? <p className="mt-1 max-w-2xl text-sm text-tinta-suave">{descricao}</p> : null}
      </div>
      {acao}
    </header>
  );
}

export function Selo({
  children,
  classe = 'bg-petroleo-50 text-petroleo-700',
}: {
  children: ReactNode;
  classe?: string;
}) {
  return <span className={`selo ${classe}`}>{children}</span>;
}

/**
 * Número grande com rótulo. O valor vem em `font-variant-numeric:
 * tabular-nums` para que uma fila de cartões não dance quando os
 * números mudarem de largura.
 */
export function Indicador({
  rotulo,
  valor,
  detalhe,
  emoji,
  destaque = false,
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  emoji?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`cartao p-4 ${destaque ? 'border-laranja-200 bg-laranja-50/60' : ''}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-tinta-suave">
        {emoji ? <span aria-hidden>{emoji}</span> : null}
        {rotulo}
      </div>
      <div
        className={`mt-2 text-2xl font-extrabold tracking-tight tabular-nums ${
          destaque ? 'text-laranja-700' : 'text-petroleo-900'
        }`}
      >
        {valor}
      </div>
      {detalhe ? <div className="mt-1 text-xs text-tinta-suave">{detalhe}</div> : null}
    </div>
  );
}

/**
 * A barra de meta — a peça mais repetida do produto. Aparece no cartão da
 * vitrine, no perfil do animal, na campanha e no painel.
 *
 * O texto acompanha sempre a barra: quem não distingue a cor, quem
 * imprime em preto e branco e quem usa leitor de tela leem o mesmo
 * número. Barra sem número é decoração.
 */
export function BarraMeta({
  percentual,
  cor = 'laranja',
  altura = 'h-2.5',
  rotulo,
}: {
  percentual: number;
  cor?: 'laranja' | 'petroleo';
  altura?: string;
  rotulo?: string;
}) {
  const pct = Math.max(0, Math.min(100, percentual));
  const fundo = cor === 'laranja' ? 'bg-laranja-500' : 'bg-petroleo-600';
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo ?? 'Progresso da meta'}
      className={`w-full overflow-hidden rounded-full bg-tinta-borda ${altura}`}
    >
      <div
        className={`h-full origin-left animate-enche rounded-full ${fundo}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Vazio({
  titulo,
  descricao,
  acao,
  emoji = '🐾',
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  emoji?: string;
}) {
  return (
    <div className="cartao flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="text-3xl" aria-hidden>
        {emoji}
      </span>
      <p className="text-base font-bold text-petroleo-900">{titulo}</p>
      {descricao ? <p className="max-w-sm text-sm text-tinta-suave">{descricao}</p> : null}
      {acao ? <div className="mt-2">{acao}</div> : null}
    </div>
  );
}

export function Aviso({
  children,
  tom = 'info',
}: {
  children: ReactNode;
  tom?: 'info' | 'alerta' | 'risco' | 'sucesso';
}) {
  const classes = {
    info: 'border-petroleo-200 bg-petroleo-50 text-petroleo-800',
    alerta: 'border-laranja-200 bg-laranja-50 text-laranja-800',
    risco: 'border-rose-200 bg-rose-50 text-rose-800',
    sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }[tom];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${classes}`} role="status">
      {children}
    </div>
  );
}

/** Linha rótulo→valor. Usada em toda ficha: animal, padrinho, despesa. */
export function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-tinta-borda/70 py-2 last:border-0">
      <dt className="text-sm text-tinta-suave">{rotulo}</dt>
      <dd className="text-right text-sm font-semibold text-tinta">{children}</dd>
    </div>
  );
}

export function Tabela({
  cabecalho,
  children,
  vazio,
}: {
  cabecalho: ReactNode[];
  children: ReactNode;
  vazio?: string;
}) {
  return (
    <div className="cartao overflow-hidden" >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-tinta-borda bg-tinta-fundo/70">
              {cabecalho.map((celula, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-tinta-suave"
                >
                  {celula}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-tinta-borda/70">{children}</tbody>
        </table>
      </div>
      {vazio ? <p className="px-4 py-8 text-center text-sm text-tinta-clara">{vazio}</p> : null}
    </div>
  );
}

export function Esqueleto({ className = 'h-5 w-32' }: { className?: string }) {
  return <span className={`esqueleto block ${className}`} />;
}
