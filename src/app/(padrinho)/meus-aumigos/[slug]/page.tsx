import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FotoAnimal } from '@/components/FotoAnimal';
import { BotaoCompartilhar } from '@/components/Compartilhar';
import { BarraMeta, Cartao, Linha, Selo } from '@/components/ui';
import { IconeRelogio } from '@/components/Icones';
import { exigirPadrinho } from '@/lib/auth';
import {
  EVENTO_DIARIO,
  PORTE,
  SEXO,
  STATUS_ANIMAL,
  STATUS_CONTRIBUICAO,
  TIPO_SAUDE,
  formatarData,
  formatarIdade,
  formatarMesAno,
  formatarPeso,
  porcento,
  reais,
} from '@/lib/format';
import { carregarMeuAumigo } from '@/server/padrinho';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Meu AUmigo ${slug}`, robots: { index: false, follow: false } };
}

export default async function MeuAumigo({ params }: { params: Promise<{ slug: string }> }) {
  const usuario = await exigirPadrinho();
  const { slug } = await params;

  const dados = await carregarMeuAumigo(usuario.padrinhoId, slug);
  if (!dados) notFound();

  const { animal, custo, apadrinhamento, destino, valorParaRatear, pagouOMes, historico } = dados;
  const status = STATUS_ANIMAL[animal.status];
  const totalDestino = destino.reduce((s, d) => s + d.valor, 0);

  return (
    <>
      <Link href="/meus-aumigos" className="botao-fantasma -ml-3 mb-2">
        ← Meus AUmigos
      </Link>

      {/* ---------- Cabeçalho ---------- */}
      <Cartao padding={false} className="overflow-hidden">
        <div className="aspect-[16/7] bg-tinta-borda">
          <FotoAnimal
            fotoId={animal.fotoCapaId}
            nome={animal.nome}
            prioridade
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Selo classe={status.classe}>
              {status.ponto} {status.rotulo}
            </Selo>
            <Selo classe="bg-laranja-100 text-laranja-800">
              🐾 AUmigo há{' '}
              {dados.mesesDeAmizade === 0
                ? 'menos de um mês'
                : `${dados.mesesDeAmizade} ${dados.mesesDeAmizade === 1 ? 'mês' : 'meses'}`}
            </Selo>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-petroleo-900">
            Como o {animal.nome} está?
          </h1>
          <p className="mt-1 text-sm text-tinta-suave">
            {SEXO[animal.sexo]} · {formatarIdade(animal.dataNascimento, animal.idadeAproximada)} ·{' '}
            {PORTE[animal.porte]} · resgatado em {formatarData(animal.dataResgate)}
          </p>
        </div>
      </Cartao>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-4">
          {/* ---------- Novidades ---------- */}
          <Cartao>
            <h2 className="titulo-seccao">Novidades do {animal.nome}</h2>
            {animal.atualizacoes.length === 0 ? (
              <p className="mt-3 text-sm text-tinta-suave">
                Ainda não há novidades registradas. Assim que a equipe contar algo sobre o{' '}
                {animal.nome}, aparece aqui e você recebe um aviso.
              </p>
            ) : (
              <ul className="mt-4 space-y-5">
                {animal.atualizacoes.map((a) => (
                  <li key={a.id} className="border-b border-tinta-borda/70 pb-5 last:border-0 last:pb-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-tinta-clara">
                      {formatarData(a.criadaEm)}
                    </p>
                    <p className="mt-0.5 text-lg font-extrabold text-petroleo-900">{a.titulo}</p>
                    <p className="mt-1.5 whitespace-pre-line leading-relaxed text-tinta">{a.texto}</p>
                    {a.foto ? (
                      <FotoAnimal
                        fotoId={a.foto.id}
                        nome={animal.nome}
                        className="mt-3 max-h-72 w-full rounded-xl border border-tinta-borda object-cover"
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          {/* ---------- Agenda ---------- */}
          {animal.registrosSaude.length > 0 ? (
            <Cartao>
              <h2 className="titulo-seccao">🏥 Próximos cuidados</h2>
              <ul className="mt-3 divide-y divide-tinta-borda/70">
                {animal.registrosSaude.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm">
                      <span className="font-semibold text-tinta">{r.titulo}</span>
                      <span className="block text-xs text-tinta-suave">{TIPO_SAUDE[r.tipo]}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-petroleo-700">
                      <IconeRelogio tamanho={14} />
                      {formatarData(r.proximaData)}
                    </span>
                  </li>
                ))}
              </ul>
            </Cartao>
          ) : null}

          {/* ---------- Diário ---------- */}
          {animal.eventosDiario.length > 0 ? (
            <Cartao>
              <h2 className="titulo-seccao">A história do {animal.nome}</h2>
              <ol className="mt-4">
                {animal.eventosDiario.map((e, i) => {
                  const ultimo = i === animal.eventosDiario.length - 1;
                  return (
                    <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                      {!ultimo ? (
                        <span
                          aria-hidden
                          className="absolute left-[17px] top-9 bottom-0 w-px bg-tinta-borda"
                        />
                      ) : null}
                      <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-tinta-borda bg-white text-sm">
                        {EVENTO_DIARIO[e.tipo].emoji}
                      </span>
                      <span className="min-w-0 flex-1 pt-1">
                        <span className="block text-xs font-bold uppercase tracking-wide text-tinta-clara">
                          {formatarData(e.data)}
                        </span>
                        <span className="block text-sm font-bold text-petroleo-900">{e.titulo}</span>
                        {e.descricao ? (
                          <span className="block text-sm text-tinta-suave">{e.descricao}</span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Cartao>
          ) : null}

          {/* ---------- Fotos ---------- */}
          {animal.fotos.length > 0 ? (
            <Cartao>
              <h2 className="titulo-seccao">📸 Fotos recentes</h2>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {animal.fotos.map((f) => (
                  <span
                    key={f.id}
                    className="aspect-square overflow-hidden rounded-xl border border-tinta-borda bg-tinta-borda"
                  >
                    {f.tipo === 'VIDEO' ? (
                      <video src={`/api/foto/${f.id}`} className="h-full w-full object-cover" controls preload="none" />
                    ) : (
                      <FotoAnimal fotoId={f.id} nome={animal.nome} className="h-full w-full object-cover" />
                    )}
                  </span>
                ))}
              </div>
            </Cartao>
          ) : null}
        </div>

        {/* ---------- Coluna do dinheiro ---------- */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          <Cartao className="border-laranja-200">
            <h2 className="titulo-seccao">Onde vai o seu apoio</h2>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-laranja-700">
              {reais(valorParaRatear)}
            </p>
            <p className="text-sm capitalize text-tinta-suave">
              {formatarMesAno(new Date())}
              {pagouOMes ? '' : ' · previsão'}
            </p>

            {destino.length > 0 ? (
              <>
                <ul className="mt-4 space-y-2">
                  {destino.map((d) => (
                    <li key={d.categoria}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-tinta-suave">
                          {d.categoria === 'ALIMENTACAO'
                            ? '🍖'
                            : d.categoria === 'MEDICAMENTO'
                              ? '💊'
                              : d.categoria === 'VETERINARIO'
                                ? '🏥'
                                : '🐾'}{' '}
                          {d.rotulo}
                        </span>
                        <span className="tabular-nums font-bold text-tinta">{reais(d.valor)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-tinta-borda">
                        <div
                          className="h-full rounded-full bg-laranja-400"
                          style={{ width: `${totalDestino > 0 ? (d.valor / totalDestino) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-tinta-clara">
                  {pagouOMes
                    ? `Distribuição proporcional ao que a ONG efetivamente gastou com o ${animal.nome} neste mês.`
                    : `Previsão com base no custo estimado do ${animal.nome}. Quando o pagamento for confirmado, a divisão passa a seguir o gasto real.`}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-tinta-suave">
                Ainda não há despesas lançadas para o {animal.nome} neste mês.
              </p>
            )}

            <Link href="/impacto" className="botao-secundario mt-4 w-full">
              Ver a prestação de contas
            </Link>
          </Cartao>

          <Cartao>
            <h2 className="titulo-seccao">Seu apadrinhamento</h2>
            <dl className="mt-2">
              <Linha rotulo="Valor mensal">{reais(apadrinhamento.valorMensal)}</Linha>
              <Linha rotulo="Desde">{formatarData(apadrinhamento.inicio)}</Linha>
              <Linha rotulo="Vencimento">dia {apadrinhamento.diaVencimento}</Linha>
              <Linha rotulo="Peso atual dele">{formatarPeso(animal.pesoAtualKg)}</Linha>
            </dl>

            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="font-bold text-petroleo-800">
                  {porcento(custo.percentual)} do custo coberto
                </span>
                <span className="tabular-nums text-tinta-suave">
                  {reais(custo.apoiado)} / {reais(custo.total)}
                </span>
              </div>
              <BarraMeta percentual={custo.percentual} rotulo={`Apoio de ${animal.nome}`} />
              <p className="mt-1.5 text-xs text-tinta-suave">
                {custo.padrinhos === 1
                  ? `Você é o único padrinho do ${animal.nome}.`
                  : `Você e mais ${custo.padrinhos - 1} ${custo.padrinhos - 1 === 1 ? 'pessoa cuidam' : 'pessoas cuidam'} do ${animal.nome}.`}
              </p>
            </div>
          </Cartao>

          <Cartao>
            <h2 className="titulo-seccao">Seus pagamentos</h2>
            <ul className="mt-3 divide-y divide-tinta-borda/70 text-sm">
              {historico.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="capitalize text-tinta-suave">{formatarMesAno(c.competencia)}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums font-semibold">{reais(c.valor)}</span>
                    <Selo classe={STATUS_CONTRIBUICAO[c.status].classe}>
                      {STATUS_CONTRIBUICAO[c.status].rotulo}
                    </Selo>
                  </span>
                </li>
              ))}
              {historico.length === 0 ? (
                <li className="py-2 text-tinta-clara">Nenhum lançamento ainda.</li>
              ) : null}
            </ul>
          </Cartao>

          <BotaoCompartilhar
            nome={animal.nome}
            url={`${env.APP_URL}/animais/${animal.slug}`}
            texto={`🐾 Conheça o ${animal.nome}!\n\nEu sou AUmigo dele e você também pode ser. Ele precisa de ajuda com alimentação e saúde.\n\n❤️ Faça parte dessa história.`}
            className="botao-secundario w-full"
          />
        </aside>
      </div>
    </>
  );
}
