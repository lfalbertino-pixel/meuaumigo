import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Indicador, Selo, Tabela, TituloPagina } from '@/components/ui';
import { exigirPadrinho } from '@/lib/auth';
import {
  STATUS_CONTRIBUICAO,
  formatarData,
  formatarMesAno,
  paraNumero,
  reais,
  reaisCurto,
} from '@/lib/format';
import { db } from '@/lib/db';
import { lerConfiguracao } from '@/server/config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Minhas contribuições',
  robots: { index: false, follow: false },
};

export default async function Contribuicoes() {
  const usuario = await exigirPadrinho();

  const [padrinho, config] = await Promise.all([
    db.padrinho.findUnique({
      where: { id: usuario.padrinhoId },
      include: {
        contribuicoes: {
          orderBy: { competencia: 'desc' },
          include: {
            animal: { select: { nome: true, slug: true } },
            campanha: { select: { titulo: true, slug: true } },
          },
        },
      },
    }),
    lerConfiguracao(),
  ]);

  if (!padrinho) notFound();

  const pagas = padrinho.contribuicoes.filter((c) => c.status === 'PAGA');
  const emAberto = padrinho.contribuicoes.filter(
    (c) => c.status === 'PENDENTE' || c.status === 'ATRASADA',
  );
  const total = pagas.reduce((s, c) => s + paraNumero(c.valor), 0);

  return (
    <>
      <TituloPagina
        titulo="Minhas contribuições"
        descricao="Tudo que você já destinou aos AUmigos, mês a mês."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Indicador emoji="❤️" rotulo="Total já destinado" valor={reaisCurto(total)} destaque />
        <Indicador emoji="✅" rotulo="Pagamentos confirmados" valor={String(pagas.length)} />
        <Indicador
          emoji="⏳"
          rotulo="Em aberto"
          valor={reaisCurto(emAberto.reduce((s, c) => s + paraNumero(c.valor), 0))}
          detalhe={`${emAberto.length} lançamentos`}
        />
      </section>

      {emAberto.length > 0 && config.chavePix ? (
        <div className="mb-5 rounded-caixa border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">Para quitar o que está em aberto</p>
          <p className="mt-1 break-all font-mono text-sm font-semibold text-amber-900">
            PIX: {config.chavePix}
          </p>
          <p className="mt-1.5 text-xs text-amber-900/80">
            A confirmação é feita pela equipe ao conferir o extrato — pode levar alguns dias úteis.
          </p>
        </div>
      ) : null}

      <Tabela
        cabecalho={['Competência', 'Destino', 'Origem', 'Valor', 'Status', 'Pago em']}
        vazio={padrinho.contribuicoes.length === 0 ? 'Nenhuma contribuição registrada.' : undefined}
      >
        {padrinho.contribuicoes.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-2.5 text-sm capitalize text-tinta-suave">
              {formatarMesAno(c.competencia)}
            </td>
            <td className="px-4 py-2.5 text-sm">
              {c.campanha ? (
                <Link href={`/campanhas/${c.campanha.slug}`} className="hover:text-laranja-600">
                  🚨 {c.campanha.titulo}
                </Link>
              ) : c.animal ? (
                <Link href={`/meus-aumigos/${c.animal.slug}`} className="hover:text-laranja-600">
                  🐾 {c.animal.nome}
                </Link>
              ) : (
                'Abrigo'
              )}
            </td>
            <td className="px-4 py-2.5 text-xs text-tinta-suave">
              {c.origem === 'APADRINHAMENTO'
                ? 'Mensalidade'
                : c.origem === 'CAMPANHA'
                  ? 'Campanha'
                  : 'Doação avulsa'}
            </td>
            <td className="px-4 py-2.5 tabular-nums font-extrabold text-petroleo-800">
              {reais(c.valor)}
            </td>
            <td className="px-4 py-2.5">
              <Selo classe={STATUS_CONTRIBUICAO[c.status].classe}>
                {STATUS_CONTRIBUICAO[c.status].rotulo}
              </Selo>
            </td>
            <td className="px-4 py-2.5 text-xs tabular-nums text-tinta-suave">
              {c.pagoEm ? formatarData(c.pagoEm) : '—'}
            </td>
          </tr>
        ))}
      </Tabela>

      <p className="mt-4 text-center text-xs text-tinta-clara">
        Precisa de recibo para imposto de renda? Fale com a equipe: {config.email ?? 'contato da ONG'}
      </p>
    </>
  );
}
