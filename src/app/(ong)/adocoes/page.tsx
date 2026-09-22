import type { Metadata } from 'next';
import Link from 'next/link';
import { Indicador, Selo, Tabela, TituloPagina, Vazio } from '@/components/ui';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import { STATUS_ADOCAO, formatarData, numero, tempoDesde } from '@/lib/format';
import { AcoesAdocao } from './Acoes';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Adoções' };

const EM_ANDAMENTO = ['INTERESSE', 'ENTREVISTA', 'VISITA', 'APROVADA'] as const;

export default async function Adocoes() {
  await exigirEquipe();

  const [emAndamento, encerradas, concluidas, disponiveis] = await Promise.all([
    db.adocao.findMany({
      where: { status: { in: [...EM_ANDAMENTO] } },
      orderBy: { abertaEm: 'asc' },
      include: { animal: { select: { id: true, nome: true, slug: true } } },
    }),
    db.adocao.findMany({
      where: { status: { in: ['CONCLUIDA', 'RECUSADA', 'DESISTENCIA'] } },
      orderBy: { abertaEm: 'desc' },
      take: 25,
      include: { animal: { select: { id: true, nome: true } } },
    }),
    db.adocao.count({ where: { status: 'CONCLUIDA' } }),
    db.animal.count({ where: { deletadoEm: null, status: 'DISPONIVEL_ADOCAO' } }),
  ]);

  return (
    <>
      <TituloPagina
        titulo="Adoções"
        descricao="Do primeiro interesse ao termo assinado. Cada passo aqui muda o status do animal na vitrine pública."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Indicador emoji="🏡" rotulo="Adoções concluídas" valor={numero(concluidas)} />
        <Indicador emoji="⏳" rotulo="Processos em andamento" valor={numero(emAndamento.length)} destaque />
        <Indicador emoji="🟢" rotulo="Disponíveis para adoção" valor={numero(disponiveis)} />
      </section>

      <h2 className="titulo-seccao mb-2">Em andamento</h2>
      {emAndamento.length === 0 ? (
        <Vazio
          emoji="🏡"
          titulo="Nenhum processo aberto"
          descricao="Quando alguém manifestar interesse pela página pública, ele aparece aqui."
        />
      ) : (
        <Tabela cabecalho={['Animal', 'Interessado', 'Contato', 'Aberto há', 'Etapa', '']}>
          {emAndamento.map((a) => {
            const respostas = (a.respostas ?? {}) as Record<string, string | null>;
            return (
              <tr key={a.id} className="transition hover:bg-tinta-fundo/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/animais-ong/${a.animal.id}`}
                    className="font-bold text-petroleo-900 hover:text-laranja-600"
                  >
                    🐾 {a.animal.nome}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="font-semibold text-tinta">{a.adotanteNome}</span>
                  {respostas.moradia ? (
                    <span className="block text-xs text-tinta-clara">{respostas.moradia}</span>
                  ) : null}
                  {respostas.rotina ? (
                    <span className="mt-1 block max-w-xs text-xs text-tinta-suave">
                      {respostas.rotina}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs text-tinta-suave">
                  {a.adotanteTelefone ?? '—'}
                  <span className="block">{a.adotanteEmail ?? ''}</span>
                  <span className="block text-tinta-clara">{a.adotanteCidade ?? ''}</span>
                </td>
                <td className="px-4 py-3 text-xs text-tinta-suave">
                  {tempoDesde(a.abertaEm)}
                  <span className="block text-tinta-clara">{formatarData(a.abertaEm)}</span>
                </td>
                <td className="px-4 py-3">
                  <Selo classe={STATUS_ADOCAO[a.status].classe}>{STATUS_ADOCAO[a.status].rotulo}</Selo>
                </td>
                <td className="px-4 py-3">
                  <AcoesAdocao id={a.id} status={a.status} />
                </td>
              </tr>
            );
          })}
        </Tabela>
      )}

      {encerradas.length > 0 ? (
        <section className="mt-8">
          <h2 className="titulo-seccao mb-2">Encerrados</h2>
          <Tabela cabecalho={['Animal', 'Interessado', 'Resultado', 'Data']}>
            {encerradas.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2.5 text-sm font-semibold">
                  <Link href={`/animais-ong/${a.animal.id}`} className="hover:text-laranja-600">
                    {a.animal.nome}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-sm text-tinta-suave">{a.adotanteNome}</td>
                <td className="px-4 py-2.5">
                  <Selo classe={STATUS_ADOCAO[a.status].classe}>{STATUS_ADOCAO[a.status].rotulo}</Selo>
                </td>
                <td className="px-4 py-2.5 text-xs tabular-nums text-tinta-suave">
                  {formatarData(a.concluidaEm ?? a.abertaEm)}
                </td>
              </tr>
            ))}
          </Tabela>
        </section>
      ) : null}
    </>
  );
}
