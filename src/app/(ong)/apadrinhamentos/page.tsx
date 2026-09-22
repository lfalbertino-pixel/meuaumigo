import type { Metadata } from 'next';
import Link from 'next/link';
import { Indicador, Selo, Tabela, TituloPagina, Vazio } from '@/components/ui';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import {
  MODALIDADE,
  STATUS_APADRINHAMENTO,
  formatarData,
  numero,
  paraNumero,
  reais,
  reaisCurto,
  tempoDesde,
} from '@/lib/format';
import { AcoesApadrinhamento } from './Acoes';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Apadrinhamentos' };

const ABAS = [
  { chave: 'ATIVO', rotulo: 'Ativos' },
  { chave: 'PAUSADO', rotulo: 'Pausados' },
  { chave: 'CANCELADO', rotulo: 'Cancelados' },
];

export default async function Apadrinhamentos({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await exigirEquipe();
  const { status = 'ATIVO' } = await searchParams;

  const [lista, ativos, contagens] = await Promise.all([
    db.apadrinhamento.findMany({
      where: { status: status as 'ATIVO' | 'PAUSADO' | 'CANCELADO' },
      orderBy: { inicio: 'desc' },
      include: {
        padrinho: { select: { id: true, nome: true, email: true } },
        animal: { select: { id: true, nome: true, slug: true } },
      },
    }),
    db.apadrinhamento.aggregate({ where: { status: 'ATIVO' }, _sum: { valorMensal: true }, _count: true }),
    db.apadrinhamento.groupBy({ by: ['status'], _count: true }),
  ]);

  const contagem = Object.fromEntries(contagens.map((c) => [c.status, c._count]));
  const receitaMensal = paraNumero(ativos._sum.valorMensal);
  const ticket = ativos._count > 0 ? receitaMensal / ativos._count : 0;

  return (
    <>
      <TituloPagina
        titulo="Apadrinhamentos"
        descricao="A renda recorrente da ONG. É o número que sustenta tudo que não é emergência."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Indicador emoji="❤️" rotulo="Apadrinhamentos ativos" valor={numero(ativos._count)} />
        <Indicador
          emoji="💰"
          rotulo="Receita recorrente"
          valor={reaisCurto(receitaMensal)}
          detalhe="por mês, se todos pagarem"
          destaque
        />
        <Indicador emoji="📊" rotulo="Valor médio" valor={reais(ticket)} detalhe="por apadrinhamento" />
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <Link
            key={a.chave}
            href={`/apadrinhamentos?status=${a.chave}`}
            aria-current={status === a.chave ? 'true' : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              status === a.chave
                ? 'border-petroleo-800 bg-petroleo-800 text-white'
                : 'border-tinta-borda bg-white text-tinta-suave hover:border-petroleo-300'
            }`}
          >
            {a.rotulo} ({contagem[a.chave] ?? 0})
          </Link>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vazio titulo="Nenhum apadrinhamento nesta aba" emoji="❤️" />
      ) : (
        <Tabela cabecalho={['Padrinho', 'AUmigo', 'Modalidade', 'Valor', 'Desde', '']}>
          {lista.map((a) => (
            <tr key={a.id} className="transition hover:bg-tinta-fundo/60">
              <td className="px-4 py-3">
                <Link
                  href={`/padrinhos/${a.padrinho.id}`}
                  className="font-bold text-petroleo-900 hover:text-laranja-600"
                >
                  {a.padrinho.nome}
                </Link>
                <span className="block text-xs text-tinta-clara">{a.padrinho.email}</span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/animais-ong/${a.animal.id}`}
                  className="font-semibold text-tinta hover:text-laranja-600"
                >
                  🐾 {a.animal.nome}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Selo classe={STATUS_APADRINHAMENTO[a.status].classe}>
                  {STATUS_APADRINHAMENTO[a.status].rotulo}
                </Selo>
                <span className="mt-1 block text-xs text-tinta-clara">{MODALIDADE[a.modalidade]}</span>
              </td>
              <td className="px-4 py-3 tabular-nums font-extrabold text-petroleo-800">
                {reais(a.valorMensal)}
              </td>
              <td className="px-4 py-3 text-xs text-tinta-suave">
                {formatarData(a.inicio)}
                <span className="block text-tinta-clara">há {tempoDesde(a.inicio)}</span>
                {a.motivoCancelamento ? (
                  <span className="mt-1 block max-w-[200px] text-tinta-clara">
                    motivo: {a.motivoCancelamento}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <AcoesApadrinhamento id={a.id} status={a.status} />
              </td>
            </tr>
          ))}
        </Tabela>
      )}
    </>
  );
}
