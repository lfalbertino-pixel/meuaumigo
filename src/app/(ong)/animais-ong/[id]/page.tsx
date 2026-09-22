import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FotoAnimal } from '@/components/FotoAnimal';
import { BarraMeta, Cartao, Linha, Selo, TituloPagina } from '@/components/ui';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import {
  ESPECIE,
  EVENTO_DIARIO,
  MODALIDADE,
  PORTE,
  SEXO,
  STATUS_ANIMAL,
  TIPO_SAUDE,
  formatarData,
  formatarIdade,
  formatarPeso,
  porcento,
  reais,
  tempoDesde,
} from '@/lib/format';
import { calcularCusto } from '@/server/custos';
import { PainelAcoes } from './PainelAcoes';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const animal = await db.animal.findUnique({ where: { id }, select: { nome: true } });
  return { title: animal?.nome ?? 'Animal' };
}

export default async function FichaAnimal({ params }: { params: Promise<{ id: string }> }) {
  await exigirEquipe();
  const { id } = await params;

  const [animal, veterinarios] = await Promise.all([
    db.animal.findFirst({
      where: { id, deletadoEm: null },
      include: {
        fotos: { orderBy: { ordem: 'asc' } },
        apadrinhamentos: {
          orderBy: [{ status: 'asc' }, { inicio: 'desc' }],
          include: { padrinho: { select: { id: true, nome: true, email: true } } },
        },
        registrosSaude: { orderBy: { data: 'desc' }, include: { veterinario: true } },
        eventosDiario: { orderBy: { data: 'desc' } },
        atualizacoes: { orderBy: { criadaEm: 'desc' }, take: 5 },
        despesas: { orderBy: { data: 'desc' }, take: 12 },
        adocoes: { orderBy: { abertaEm: 'desc' } },
      },
    }),
    db.veterinario.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
  ]);

  if (!animal) notFound();

  const custo = calcularCusto(animal);
  const status = STATUS_ANIMAL[animal.status];
  const ativos = animal.apadrinhamentos.filter((a) => a.status === 'ATIVO');
  const gastoTotal = animal.despesas.reduce((s, d) => s + Number(d.valor), 0);

  return (
    <>
      <Link href="/animais-ong" className="botao-fantasma -ml-3 mb-2">
        ← Animais
      </Link>

      <TituloPagina
        titulo={animal.nome}
        descricao={
          <>
            {ESPECIE[animal.especie]} · {SEXO[animal.sexo]} ·{' '}
            {formatarIdade(animal.dataNascimento, animal.idadeAproximada)} · {PORTE[animal.porte]}
            {animal.raca ? ` · ${animal.raca}` : ''}
          </>
        }
        acao={
          <div className="flex flex-wrap gap-2">
            <Link href={`/animais/${animal.slug}`} className="botao-secundario" target="_blank">
              Ver página pública ↗
            </Link>
            <Link href={`/animais-ong/${animal.id}/editar`} className="botao-primario">
              Editar
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[320px_1fr] xl:items-start">
        {/* ---------- Coluna da ficha ---------- */}
        <div className="space-y-4">
          <Cartao padding={false} className="overflow-hidden">
            <div className="aspect-[4/3] bg-tinta-borda">
              <FotoAnimal
                fotoId={animal.fotoCapaId}
                nome={animal.nome}
                prioridade
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <Selo classe={status.classe}>
                {status.ponto} {status.rotulo}
              </Selo>
              <dl className="mt-3">
                <Linha rotulo="Resgatado em">{formatarData(animal.dataResgate)}</Linha>
                <Linha rotulo="Tempo conosco">{tempoDesde(animal.dataResgate)}</Linha>
                <Linha rotulo="Onde está">{animal.localAbrigo ?? '—'}</Linha>
                <Linha rotulo="Peso atual">{formatarPeso(animal.pesoAtualKg)}</Linha>
                <Linha rotulo="Castrado">{animal.castrado ? 'Sim' : 'Não'}</Linha>
                <Linha rotulo="Vacinas em dia">{animal.vacinasEmDia ? 'Sim' : 'Não'}</Linha>
                {animal.necessidadeEspecial ? (
                  <Linha rotulo="Cuidado especial">{animal.descricaoNecessidade ?? 'Sim'}</Linha>
                ) : null}
              </dl>
            </div>
          </Cartao>

          <Cartao className="border-laranja-200">
            <h2 className="titulo-seccao">Custo e apoio mensal</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-tinta-suave">🍖 Alimentação</dt>
                <dd className="tabular-nums font-semibold">{reais(custo.alimentacao)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tinta-suave">🏥 Tratamento</dt>
                <dd className="tabular-nums font-semibold">{reais(custo.tratamento)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tinta-suave">💊 Medicamentos</dt>
                <dd className="tabular-nums font-semibold">{reais(custo.medicamento)}</dd>
              </div>
              <div className="flex justify-between border-t border-tinta-borda pt-1.5">
                <dt className="font-bold text-petroleo-900">Custo mensal</dt>
                <dd className="tabular-nums font-extrabold">{reais(custo.total)}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <BarraMeta percentual={custo.percentual} altura="h-3" rotulo={`Apoio de ${animal.nome}`} />
              <p className="mt-1.5 text-sm font-semibold tabular-nums text-tinta-suave">
                {reais(custo.apoiado)} apoiados · {porcento(custo.percentual)}
                {custo.falta > 0 ? ` · faltam ${reais(custo.falta)}` : ''}
              </p>
            </div>
          </Cartao>

          <Cartao>
            <h2 className="titulo-seccao">
              Padrinhos ({ativos.length} {ativos.length === 1 ? 'ativo' : 'ativos'})
            </h2>
            {animal.apadrinhamentos.length === 0 ? (
              <p className="mt-3 text-sm text-tinta-clara">
                Ninguém apadrinhou o {animal.nome} ainda.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-tinta-borda/70">
                {animal.apadrinhamentos.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <Link
                        href={`/padrinhos/${a.padrinho.id}`}
                        className="block truncate text-sm font-bold text-petroleo-900 hover:text-laranja-600"
                      >
                        {a.padrinho.nome}
                      </Link>
                      <span className="text-xs text-tinta-suave">
                        {MODALIDADE[a.modalidade]} · desde {formatarData(a.inicio)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-extrabold tabular-nums text-petroleo-800">
                        {reais(a.valorMensal)}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          a.status === 'ATIVO' ? 'text-emerald-700' : 'text-tinta-clara'
                        }`}
                      >
                        {a.status === 'ATIVO' ? 'ativo' : a.status.toLowerCase()}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          {animal.adocoes.length > 0 ? (
            <Cartao>
              <h2 className="titulo-seccao">Processos de adoção</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {animal.adocoes.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{a.adotanteNome}</span>
                    <span className="shrink-0 text-xs font-bold text-tinta-suave">{a.status}</span>
                  </li>
                ))}
              </ul>
              <Link href="/adocoes" className="mt-3 inline-block text-xs font-bold text-laranja-600 hover:underline">
                gerenciar adoções →
              </Link>
            </Cartao>
          ) : null}
        </div>

        {/* ---------- Coluna de trabalho ---------- */}
        <div className="space-y-4">
          <PainelAcoes
            animalId={animal.id}
            animalNome={animal.nome}
            padrinhosAtivos={ativos.length}
            veterinarios={veterinarios}
          />

          {animal.fotos.length > 0 ? (
            <Cartao>
              <h2 className="titulo-seccao">Galeria ({animal.fotos.length})</h2>
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {animal.fotos.map((f) => (
                  <span
                    key={f.id}
                    className={`aspect-square overflow-hidden rounded-lg border-2 bg-tinta-borda ${
                      f.id === animal.fotoCapaId ? 'border-laranja-400' : 'border-transparent'
                    }`}
                    title={f.id === animal.fotoCapaId ? 'Foto de capa' : (f.legenda ?? '')}
                  >
                    {f.tipo === 'VIDEO' ? (
                      <video src={`/api/foto/${f.id}`} className="h-full w-full object-cover" preload="none" />
                    ) : (
                      <FotoAnimal fotoId={f.id} nome={animal.nome} className="h-full w-full object-cover" />
                    )}
                  </span>
                ))}
              </div>
            </Cartao>
          ) : null}

          <Cartao>
            <h2 className="titulo-seccao">Histórico médico</h2>
            {animal.registrosSaude.length === 0 ? (
              <p className="mt-3 text-sm text-tinta-clara">Nenhum registro de saúde.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-tinta-borda text-left text-xs uppercase tracking-wide text-tinta-suave">
                      <th className="py-2 pr-3 font-bold">Data</th>
                      <th className="py-2 pr-3 font-bold">Evento</th>
                      <th className="py-2 pr-3 font-bold">Veterinário</th>
                      <th className="py-2 pr-3 text-right font-bold">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tinta-borda/60">
                    {animal.registrosSaude.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 pr-3 tabular-nums text-tinta-suave">
                          {formatarData(r.data)}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="font-semibold text-tinta">{r.titulo}</span>
                          <span className="block text-xs text-tinta-clara">
                            {TIPO_SAUDE[r.tipo]}
                            {r.proximaData ? ` · retorno em ${formatarData(r.proximaData)}` : ''}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-xs text-tinta-suave">
                          {r.veterinario?.nome ?? '—'}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums font-semibold">
                          {r.valor ? reais(r.valor) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Cartao>

          <div className="grid gap-4 lg:grid-cols-2">
            <Cartao>
              <h2 className="titulo-seccao">Diário</h2>
              {animal.eventosDiario.length === 0 ? (
                <p className="mt-3 text-sm text-tinta-clara">Diário vazio.</p>
              ) : (
                <ol className="mt-3 space-y-3">
                  {animal.eventosDiario.map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <span className="text-lg leading-none" aria-hidden>
                        {EVENTO_DIARIO[e.tipo].emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold uppercase tracking-wide text-tinta-clara">
                          {formatarData(e.data)}
                          {e.interno ? ' · interno' : ''}
                        </span>
                        <span className="block text-sm font-semibold text-tinta">{e.titulo}</span>
                        {e.descricao ? (
                          <span className="block text-xs text-tinta-suave">{e.descricao}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Cartao>

            <Cartao>
              <h2 className="titulo-seccao">Últimas despesas</h2>
              {animal.despesas.length === 0 ? (
                <p className="mt-3 text-sm text-tinta-clara">Nenhuma despesa lançada.</p>
              ) : (
                <>
                  <ul className="mt-3 divide-y divide-tinta-borda/70 text-sm">
                    {animal.despesas.map((d) => (
                      <li key={d.id} className="flex items-baseline justify-between gap-3 py-2">
                        <span className="min-w-0">
                          <span className="block truncate text-tinta">{d.descricao}</span>
                          <span className="text-xs text-tinta-clara">{formatarData(d.data)}</span>
                        </span>
                        <span className="shrink-0 tabular-nums font-semibold">{reais(d.valor)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-right text-sm font-bold text-petroleo-900">
                    Soma exibida: <span className="tabular-nums">{reais(gastoTotal)}</span>
                  </p>
                </>
              )}
            </Cartao>
          </div>

          {animal.atualizacoes.length > 0 ? (
            <Cartao>
              <h2 className="titulo-seccao">Novidades enviadas aos padrinhos</h2>
              <ul className="mt-3 space-y-3">
                {animal.atualizacoes.map((a) => (
                  <li key={a.id}>
                    <p className="text-xs font-bold uppercase tracking-wide text-tinta-clara">
                      {formatarData(a.criadaEm)}
                      {a.publica ? ' · também pública' : ''}
                    </p>
                    <p className="text-sm font-semibold text-tinta">{a.titulo}</p>
                    <p className="text-sm text-tinta-suave">{a.texto}</p>
                  </li>
                ))}
              </ul>
            </Cartao>
          ) : null}
        </div>
      </div>
    </>
  );
}
