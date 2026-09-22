import type { Metadata } from 'next';
import Link from 'next/link';
import { Indicador, Tabela, TituloPagina, Vazio } from '@/components/ui';
import { IconeBusca } from '@/components/Icones';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import { formatarData, numero, paraNumero, reais, reaisCurto, tempoDesde } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Padrinhos' };

export default async function Padrinhos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await exigirEquipe();
  const { q = '' } = await searchParams;

  const padrinhos = await db.padrinho.findMany({
    where: {
      deletadoEm: null,
      ...(q.trim()
        ? {
            OR: [
              { nome: { contains: q.trim(), mode: 'insensitive' as const } },
              { email: { contains: q.trim(), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { desde: 'desc' },
    include: {
      apadrinhamentos: {
        select: { status: true, valorMensal: true, animal: { select: { nome: true } } },
      },
    },
  });

  const ativos = padrinhos.filter((p) => p.apadrinhamentos.some((a) => a.status === 'ATIVO'));
  const receita = ativos.reduce(
    (soma, p) =>
      soma +
      p.apadrinhamentos
        .filter((a) => a.status === 'ATIVO')
        .reduce((s, a) => s + paraNumero(a.valorMensal), 0),
    0,
  );

  return (
    <>
      <TituloPagina
        titulo="Padrinhos"
        descricao="Quem sustenta o abrigo todo mês. Trate esta lista como o ativo mais valioso da ONG."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Indicador emoji="👥" rotulo="Padrinhos cadastrados" valor={numero(padrinhos.length)} />
        <Indicador emoji="❤️" rotulo="Com apadrinhamento ativo" valor={numero(ativos.length)} />
        <Indicador emoji="💰" rotulo="Receita recorrente" valor={reaisCurto(receita)} destaque />
      </section>

      <form method="get" className="mb-4 flex gap-2">
        <div className="relative flex-1 sm:max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-clara">
            <IconeBusca tamanho={17} />
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou e-mail"
            className="campo pl-9"
            aria-label="Buscar padrinho"
          />
        </div>
        <button type="submit" className="botao-secundario">
          Buscar
        </button>
      </form>

      {padrinhos.length === 0 ? (
        <Vazio titulo="Nenhum padrinho encontrado" emoji="👥" />
      ) : (
        <Tabela cabecalho={['Padrinho', 'AUmigos', 'Contribuição', 'Desde', '']}>
          {padrinhos.map((p) => {
            const meus = p.apadrinhamentos.filter((a) => a.status === 'ATIVO');
            const total = meus.reduce((s, a) => s + paraNumero(a.valorMensal), 0);
            return (
              <tr key={p.id} className="transition hover:bg-tinta-fundo/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/padrinhos/${p.id}`}
                    className="font-bold text-petroleo-900 hover:text-laranja-600"
                  >
                    {p.nome}
                  </Link>
                  <span className="block text-xs text-tinta-clara">{p.email}</span>
                </td>
                <td className="px-4 py-3 text-xs text-tinta-suave">
                  {meus.length === 0 ? (
                    <span className="text-tinta-clara">nenhum ativo</span>
                  ) : (
                    meus.map((a) => a.animal.nome).join(', ')
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums font-extrabold text-petroleo-800">
                  {total > 0 ? `${reais(total)}/mês` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-tinta-suave">
                  {formatarData(p.desde)}
                  <span className="block text-tinta-clara">há {tempoDesde(p.desde)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/padrinhos/${p.id}`}
                    className="text-xs font-bold text-petroleo-600 hover:underline"
                  >
                    abrir →
                  </Link>
                </td>
              </tr>
            );
          })}
        </Tabela>
      )}
    </>
  );
}
