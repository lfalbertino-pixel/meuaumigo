import type { Metadata } from 'next';
import Link from 'next/link';
import { Cartao, Indicador, Selo, Tabela, TituloPagina } from '@/components/ui';
import { IconeRelogio } from '@/components/Icones';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import { TIPO_SAUDE, formatarData, numero, paraNumero, reais, reaisCurto } from '@/lib/format';
import { inicioDoMes, fimDoMes } from '@/server/periodo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Saúde' };

export default async function Saude() {
  await exigirEquipe();

  const agora = new Date();
  const mes = inicioDoMes(agora);
  const proximo = fimDoMes(agora);
  const em30dias = new Date(agora.getTime() + 30 * 86_400_000);

  const [agenda, ultimos, gastoMes, porAnimal, semVacina, veterinarios] = await Promise.all([
    db.registroSaude.findMany({
      where: { proximaData: { gte: agora, lt: em30dias } },
      orderBy: { proximaData: 'asc' },
      include: { animal: { select: { id: true, nome: true } }, veterinario: true },
    }),
    db.registroSaude.findMany({
      orderBy: { data: 'desc' },
      take: 40,
      include: { animal: { select: { id: true, nome: true } }, veterinario: true },
    }),
    db.despesa.aggregate({
      where: { categoria: { in: ['VETERINARIO', 'MEDICAMENTO'] }, data: { gte: mes, lt: proximo } },
      _sum: { valor: true },
    }),
    db.despesa.groupBy({
      by: ['animalId'],
      where: {
        categoria: { in: ['VETERINARIO', 'MEDICAMENTO'] },
        data: { gte: mes, lt: proximo },
        animalId: { not: null },
      },
      _sum: { valor: true },
      orderBy: { _sum: { valor: 'desc' } },
      take: 8,
    }),
    db.animal.count({ where: { ativo: true, deletadoEm: null, vacinasEmDia: false } }),
    db.veterinario.count({ where: { ativo: true } }),
  ]);

  const nomes = new Map(
    (
      await db.animal.findMany({
        where: { id: { in: porAnimal.map((p) => p.animalId!).filter(Boolean) } },
        select: { id: true, nome: true },
      })
    ).map((a) => [a.id, a.nome]),
  );

  const totalMes = paraNumero(gastoMes._sum.valor);
  const concentracao = porAnimal.slice(0, 5).reduce((s, p) => s + paraNumero(p._sum.valor), 0);

  return (
    <>
      <TituloPagina
        titulo="Saúde"
        descricao="Agenda clínica, histórico e para onde está indo a despesa veterinária do mês."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador emoji="🏥" rotulo="Vet + medicamentos no mês" valor={reaisCurto(totalMes)} destaque />
        <Indicador emoji="📅" rotulo="Retornos em 30 dias" valor={numero(agenda.length)} />
        <Indicador emoji="💉" rotulo="Vacinas pendentes" valor={numero(semVacina)} detalhe="animais ativos" />
        <Indicador emoji="🩺" rotulo="Veterinários cadastrados" valor={numero(veterinarios)} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px] xl:items-start">
        <div className="space-y-4">
          <div>
            <h2 className="titulo-seccao mb-2">Histórico recente</h2>
            <Tabela
              cabecalho={['Data', 'Animal', 'Evento', 'Veterinário', 'Valor']}
              vazio={ultimos.length === 0 ? 'Nenhum registro de saúde ainda.' : undefined}
            >
              {ultimos.map((r) => (
                <tr key={r.id} className="transition hover:bg-tinta-fundo/60">
                  <td className="px-4 py-2.5 text-sm tabular-nums text-tinta-suave">
                    {formatarData(r.data)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/animais-ong/${r.animal.id}`}
                      className="text-sm font-bold text-petroleo-900 hover:text-laranja-600"
                    >
                      {r.animal.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    <span className="font-semibold text-tinta">{r.titulo}</span>
                    <span className="mt-0.5 block">
                      <Selo>{TIPO_SAUDE[r.tipo]}</Selo>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-tinta-suave">{r.veterinario?.nome ?? '—'}</td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold">
                    {r.valor ? reais(r.valor) : '—'}
                  </td>
                </tr>
              ))}
            </Tabela>
            <p className="mt-2 text-xs text-tinta-clara">
              Para lançar um atendimento, abra a ficha do animal — o registro precisa saber de quem é.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Cartao>
            <h2 className="titulo-seccao">Próximos 30 dias</h2>
            {agenda.length === 0 ? (
              <p className="mt-3 text-sm text-tinta-clara">Nada agendado.</p>
            ) : (
              <ul className="mt-3 divide-y divide-tinta-borda/70">
                {agenda.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <Link
                        href={`/animais-ong/${r.animal.id}`}
                        className="block truncate text-sm font-bold text-petroleo-900 hover:text-laranja-600"
                      >
                        {r.animal.nome}
                      </Link>
                      <span className="text-xs text-tinta-suave">
                        {TIPO_SAUDE[r.tipo]} · {r.titulo}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-petroleo-700">
                      <IconeRelogio tamanho={13} />
                      {formatarData(r.proximaData)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          <Cartao>
            <h2 className="titulo-seccao">Maiores custos do mês</h2>
            {porAnimal.length === 0 ? (
              <p className="mt-3 text-sm text-tinta-clara">Nenhuma despesa clínica no mês.</p>
            ) : (
              <>
                <p className="mt-1 text-sm text-tinta-suave">
                  {totalMes > 0
                    ? `${Math.round((concentracao / totalMes) * 100)}% da despesa clínica do mês está em ${Math.min(5, porAnimal.length)} animais.`
                    : ''}
                </p>
                <ul className="mt-3 space-y-2">
                  {porAnimal.map((p) => {
                    const valor = paraNumero(p._sum.valor);
                    const pct = totalMes > 0 ? (valor / totalMes) * 100 : 0;
                    return (
                      <li key={p.animalId}>
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <Link
                            href={`/animais-ong/${p.animalId}`}
                            className="truncate font-semibold text-tinta hover:text-laranja-600"
                          >
                            {nomes.get(p.animalId!) ?? '—'}
                          </Link>
                          <span className="shrink-0 tabular-nums font-bold text-petroleo-800">
                            {reais(valor)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-tinta-borda">
                          <div className="h-full rounded-full bg-petroleo-500" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Cartao>
        </div>
      </div>
    </>
  );
}
