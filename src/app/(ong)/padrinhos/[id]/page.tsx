import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RetratoGerado } from '@/components/FotoAnimal';
import { Cartao, Linha, Selo, Tabela, TituloPagina } from '@/components/ui';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import {
  MODALIDADE,
  STATUS_APADRINHAMENTO,
  STATUS_CONTRIBUICAO,
  formatarData,
  formatarMesAno,
  paraNumero,
  reais,
  tempoDesde,
} from '@/lib/format';
import { calcularConquistas, type DadosConquista } from '@/server/gamificacao';
import { mesesEntre } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = await db.padrinho.findUnique({ where: { id }, select: { nome: true } });
  return { title: p?.nome ?? 'Padrinho' };
}

export default async function FichaPadrinho({ params }: { params: Promise<{ id: string }> }) {
  await exigirEquipe();
  const { id } = await params;

  const padrinho = await db.padrinho.findFirst({
    where: { id, deletadoEm: null },
    include: {
      usuario: { select: { email: true, ativo: true } },
      apadrinhamentos: {
        orderBy: [{ status: 'asc' }, { inicio: 'desc' }],
        include: { animal: { select: { id: true, nome: true, slug: true } } },
      },
      contribuicoes: { orderBy: { competencia: 'desc' }, take: 24, include: { animal: { select: { nome: true } } } },
    },
  });

  if (!padrinho) notFound();

  const ativos = padrinho.apadrinhamentos.filter((a) => a.status === 'ATIVO');
  const mensal = ativos.reduce((s, a) => s + paraNumero(a.valorMensal), 0);
  const totalPago = padrinho.contribuicoes
    .filter((c) => c.status === 'PAGA')
    .reduce((s, c) => s + paraNumero(c.valor), 0);
  const emAberto = padrinho.contribuicoes.filter((c) => c.status === 'PENDENTE' || c.status === 'ATRASADA');

  const maisAntigo = padrinho.apadrinhamentos.reduce<Date | null>(
    (mais, a) => (!mais || a.inicio < mais ? a.inicio : mais),
    null,
  );

  const dados: DadosConquista = {
    mesesMaisAntigo: maisAntigo ? mesesEntre(maisAntigo, new Date()) : 0,
    animaisApoiados: new Set(padrinho.apadrinhamentos.map((a) => a.animal.id)).size,
    animaisAtivos: ativos.length,
    mesesPagos: padrinho.contribuicoes.filter((c) => c.status === 'PAGA').length,
    apoiouCampanha: padrinho.contribuicoes.some((c) => c.origem === 'CAMPANHA'),
  };
  const conquistas = calcularConquistas(dados).filter((c) => c.conquistada);

  return (
    <>
      <Link href="/padrinhos" className="botao-fantasma -ml-3 mb-2">
        ← Padrinhos
      </Link>

      <TituloPagina
        titulo={
          <span className="flex items-center gap-3">
            <span className="h-11 w-11 overflow-hidden rounded-full">
              <RetratoGerado nome={padrinho.nome} className="h-full w-full" />
            </span>
            {padrinho.nome}
          </span>
        }
        descricao={`${padrinho.email}${padrinho.telefone ? ` · ${padrinho.telefone}` : ''} · AUmigo há ${tempoDesde(padrinho.desde)}`}
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="space-y-4">
          <Cartao>
            <h2 className="titulo-seccao">Cadastro</h2>
            <dl className="mt-2">
              <Linha rotulo="E-mail">{padrinho.email}</Linha>
              <Linha rotulo="Telefone">{padrinho.telefone ?? '—'}</Linha>
              <Linha rotulo="CPF">{padrinho.documento ?? '—'}</Linha>
              <Linha rotulo="Cidade">
                {padrinho.cidade ? `${padrinho.cidade}${padrinho.estado ? `/${padrinho.estado}` : ''}` : '—'}
              </Linha>
              <Linha rotulo="Padrinho desde">{formatarData(padrinho.desde)}</Linha>
              <Linha rotulo="Recebe novidades">{padrinho.aceitaNotificacao ? 'Sim' : 'Não'}</Linha>
              <Linha rotulo="Perfil público">{padrinho.perfilPublico ? 'Sim' : 'Não'}</Linha>
              <Linha rotulo="Acesso ao sistema">
                {padrinho.usuario ? (padrinho.usuario.ativo ? 'Ativo' : 'Desativado') : 'Sem login'}
              </Linha>
            </dl>
          </Cartao>

          <Cartao className="border-laranja-200">
            <h2 className="titulo-seccao">Contribuição</h2>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-laranja-700">
              {reais(mensal)}
              <span className="text-base font-semibold text-tinta-suave">/mês</span>
            </p>
            <p className="mt-1 text-sm text-tinta-suave">
              {ativos.length} {ativos.length === 1 ? 'AUmigo apadrinhado' : 'AUmigos apadrinhados'}
            </p>
            <dl className="mt-3">
              <Linha rotulo="Total já pago (24 meses)">{reais(totalPago)}</Linha>
              <Linha rotulo="Em aberto">
                {emAberto.length > 0 ? (
                  <span className="text-risco">
                    {reais(emAberto.reduce((s, c) => s + paraNumero(c.valor), 0))}
                  </span>
                ) : (
                  'nada'
                )}
              </Linha>
            </dl>
          </Cartao>

          {conquistas.length > 0 ? (
            <Cartao>
              <h2 className="titulo-seccao">Conquistas</h2>
              <ul className="mt-3 space-y-2">
                {conquistas.map((c) => (
                  <li key={c.codigo} className="flex items-center gap-2.5 text-sm">
                    <span className="text-lg" aria-hidden>
                      {c.emoji}
                    </span>
                    <span className="font-semibold text-tinta">{c.titulo}</span>
                  </li>
                ))}
              </ul>
            </Cartao>
          ) : null}

          {padrinho.observacoes ? (
            <Cartao>
              <h2 className="titulo-seccao">Observações da equipe</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-tinta-suave">{padrinho.observacoes}</p>
            </Cartao>
          ) : null}
        </div>

        <div className="space-y-4">
          <Cartao padding={false}>
            <h2 className="titulo-seccao px-5 pt-5">AUmigos apadrinhados</h2>
            <div className="mt-3">
              {padrinho.apadrinhamentos.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-tinta-clara">Nenhum apadrinhamento.</p>
              ) : (
                <ul className="divide-y divide-tinta-borda/70">
                  {padrinho.apadrinhamentos.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="min-w-0">
                        <Link
                          href={`/animais-ong/${a.animal.id}`}
                          className="block truncate font-bold text-petroleo-900 hover:text-laranja-600"
                        >
                          🐾 {a.animal.nome}
                        </Link>
                        <span className="text-xs text-tinta-suave">
                          {MODALIDADE[a.modalidade]} · desde {formatarData(a.inicio)}
                          {a.fim ? ` · encerrado em ${formatarData(a.fim)}` : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block tabular-nums font-extrabold text-petroleo-800">
                          {reais(a.valorMensal)}
                        </span>
                        <Selo classe={STATUS_APADRINHAMENTO[a.status].classe}>
                          {STATUS_APADRINHAMENTO[a.status].rotulo}
                        </Selo>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Cartao>

          <div>
            <h2 className="titulo-seccao mb-2">Histórico de contribuições</h2>
            <Tabela
              cabecalho={['Competência', 'AUmigo', 'Origem', 'Valor', 'Status']}
              vazio={padrinho.contribuicoes.length === 0 ? 'Nenhuma contribuição registrada.' : undefined}
            >
              {padrinho.contribuicoes.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 text-sm capitalize text-tinta-suave">
                    {formatarMesAno(c.competencia)}
                  </td>
                  <td className="px-4 py-2.5 text-sm">{c.animal?.nome ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-tinta-suave">
                    {c.origem === 'APADRINHAMENTO'
                      ? 'Mensalidade'
                      : c.origem === 'CAMPANHA'
                        ? 'Campanha'
                        : 'Doação avulsa'}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold">{reais(c.valor)}</td>
                  <td className="px-4 py-2.5">
                    <Selo classe={STATUS_CONTRIBUICAO[c.status].classe}>
                      {STATUS_CONTRIBUICAO[c.status].rotulo}
                    </Selo>
                  </td>
                </tr>
              ))}
            </Tabela>
          </div>
        </div>
      </div>
    </>
  );
}
