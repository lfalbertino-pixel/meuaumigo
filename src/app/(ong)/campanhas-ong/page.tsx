import type { Metadata } from 'next';
import Link from 'next/link';
import { BarraMeta, Cartao, Indicador, Selo, TituloPagina, Vazio } from '@/components/ui';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import {
  STATUS_CAMPANHA,
  formatarData,
  numero,
  paraNumero,
  porcento,
  reaisCurto,
} from '@/lib/format';
import { AcoesCampanha, FormularioCampanha } from './Formularios';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Campanhas' };

export default async function CampanhasOng() {
  await exigirEquipe();

  const [campanhas, animais] = await Promise.all([
    db.campanha.findMany({
      orderBy: [{ status: 'asc' }, { criadaEm: 'desc' }],
      include: {
        animal: { select: { id: true, nome: true } },
        contribuicoes: { select: { valor: true, status: true } },
      },
    }),
    db.animal.findMany({
      where: { deletadoEm: null, ativo: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    }),
  ]);

  const enriquecidas = campanhas.map((c) => {
    const pagas = c.contribuicoes.filter((x) => x.status === 'PAGA');
    const arrecadado = pagas.reduce((s, x) => s + paraNumero(x.valor), 0);
    const pendente = c.contribuicoes
      .filter((x) => x.status === 'PENDENTE' || x.status === 'ATRASADA')
      .reduce((s, x) => s + paraNumero(x.valor), 0);
    return { ...c, meta: paraNumero(c.meta), arrecadado, pendente, doadores: pagas.length };
  });

  const ativas = enriquecidas.filter((c) => c.status === 'ATIVA');
  const totalArrecadado = enriquecidas.reduce((s, c) => s + c.arrecadado, 0);

  return (
    <>
      <TituloPagina
        titulo="Campanhas"
        descricao="Emergências que não esperam o mês fechar. Cada uma gera um link público para compartilhar."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Indicador emoji="🚨" rotulo="Campanhas ativas" valor={numero(ativas.length)} />
        <Indicador emoji="💰" rotulo="Total arrecadado" valor={reaisCurto(totalArrecadado)} destaque />
        <Indicador
          emoji="🎯"
          rotulo="Meta das ativas"
          valor={reaisCurto(ativas.reduce((s, c) => s + c.meta, 0))}
        />
      </section>

      <div className="mb-6">
        <FormularioCampanha animais={animais} />
      </div>

      {enriquecidas.length === 0 ? (
        <Vazio emoji="🚨" titulo="Nenhuma campanha criada" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {enriquecidas.map((c) => {
            const pct = c.meta > 0 ? (c.arrecadado / c.meta) * 100 : 0;
            return (
              <Cartao key={c.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Selo classe={STATUS_CAMPANHA[c.status].classe}>
                        {STATUS_CAMPANHA[c.status].rotulo}
                      </Selo>
                      {c.urgente ? <Selo classe="bg-rose-600 text-white">🚨 Urgente</Selo> : null}
                    </div>
                    <h2 className="mt-2 text-lg font-extrabold text-petroleo-900">{c.titulo}</h2>
                    <p className="mt-0.5 text-sm text-tinta-suave">{c.resumo}</p>
                    {c.animal ? (
                      <Link
                        href={`/animais-ong/${c.animal.id}`}
                        className="mt-1 inline-block text-xs font-bold text-laranja-600 hover:underline"
                      >
                        🐾 {c.animal.nome}
                      </Link>
                    ) : null}
                  </div>
                  <AcoesCampanha id={c.id} status={c.status} />
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-extrabold tabular-nums text-laranja-700">
                      {reaisCurto(c.arrecadado)}
                    </span>
                    <span className="tabular-nums text-tinta-suave">
                      meta {reaisCurto(c.meta)} · {porcento(pct)}
                    </span>
                  </div>
                  <BarraMeta percentual={pct} altura="h-3" rotulo={c.titulo} />
                  <p className="mt-1.5 text-xs text-tinta-suave">
                    {c.doadores} {c.doadores === 1 ? 'doação confirmada' : 'doações confirmadas'}
                    {c.pendente > 0 ? ` · ${reaisCurto(c.pendente)} aguardando confirmação` : ''}
                    {c.prazo ? ` · prazo ${formatarData(c.prazo)}` : ''}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={`/campanhas/${c.slug}`} className="botao-secundario" target="_blank">
                    Ver página pública ↗
                  </Link>
                </div>
              </Cartao>
            );
          })}
        </div>
      )}
    </>
  );
}
