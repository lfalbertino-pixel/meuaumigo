import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FotoAnimal, RetratoGerado } from '@/components/FotoAnimal';
import { BotaoCompartilhar } from '@/components/Compartilhar';
import { BarraMeta, Cartao, Selo } from '@/components/ui';
import { IconeCoracaoCheio } from '@/components/Icones';
import {
  ESPECIE,
  EVENTO_DIARIO,
  PORTE,
  SEXO,
  STATUS_ANIMAL,
  formatarData,
  formatarIdade,
  formatarPeso,
  porcento,
  reais,
  reaisCurto,
  tempoDesde,
} from '@/lib/format';
import { carregarPerfilPublico } from '@/server/publico';
import { lerConfiguracao } from '@/server/config';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const perfil = await carregarPerfilPublico(slug);
  if (!perfil) return { title: 'AUmigo não encontrado' };

  const { animal } = perfil;
  const descricao =
    animal.historiaResgate?.slice(0, 180) ??
    `${animal.nome} foi resgatado em ${formatarData(animal.dataResgate)} e precisa de um AUmigo para ajudar nos custos de alimentação e saúde.`;

  return {
    title: `${animal.nome} — apadrinhe`,
    description: descricao,
    openGraph: {
      title: `Conheça o ${animal.nome} 🐾`,
      description: descricao,
      // A foto de capa é o que aparece no preview do WhatsApp. Sem ela,
      // o link vira um retângulo cinza e ninguém abre.
      // Sem foto de capa, cai para a arte da marca. Link sem imagem no
      // WhatsApp vira um retângulo cinza, e retângulo cinza ninguém abre.
      images: [
        animal.fotoCapaId
          ? `${env.APP_URL}/api/foto/${animal.fotoCapaId}`
          : `${env.APP_URL}/marca/og-padrao.png`,
      ],
    },
  };
}

export default async function PerfilAnimal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [perfil, config] = await Promise.all([carregarPerfilPublico(slug), lerConfiguracao()]);
  if (!perfil) notFound();

  const { animal, custo, resumoSaude, campanhas } = perfil;
  const status = STATUS_ANIMAL[animal.status];
  const url = `${env.APP_URL}/animais/${animal.slug}`;
  const galeria = animal.fotos.filter((f) => f.id !== animal.fotoCapaId).slice(0, 6);

  const textoCompartilhar = `🐾 Conheça o ${animal.nome}!\n\nEle foi resgatado e precisa de um AUmigo para ajudar nos custos de alimentação e saúde.\n\n❤️ Você pode fazer parte dessa história.`;

  const padrinhosVisiveis = animal.apadrinhamentos.filter(
    (a) => a.exibirNoPerfil && a.padrinho.perfilPublico,
  );

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/animais" className="botao-fantasma -ml-3 mb-3">
        ← Todos os AUmigos
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* ---------- Coluna da história ---------- */}
        <div>
          <div className="overflow-hidden rounded-caixa border border-tinta-borda bg-white shadow-cartao">
            <div className="aspect-[16/10] bg-tinta-borda">
              <FotoAnimal
                fotoId={animal.fotoCapaId}
                nome={animal.nome}
                prioridade
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Selo classe={status.classe}>
                  {status.ponto} {status.rotulo}
                </Selo>
                {custo.padrinhos > 0 ? (
                  <Selo classe="bg-laranja-100 text-laranja-800">
                    ❤️ {custo.padrinhos} {custo.padrinhos === 1 ? 'padrinho' : 'padrinhos'}
                  </Selo>
                ) : (
                  <Selo classe="bg-laranja-500 text-white">Ainda sem padrinho</Selo>
                )}
                {animal.necessidadeEspecial ? (
                  <Selo classe="bg-petroleo-100 text-petroleo-800">Cuidado especial</Selo>
                ) : null}
              </div>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-petroleo-900">
                {animal.nome}
              </h1>
              <p className="mt-1 text-tinta-suave">
                {ESPECIE[animal.especie]} · {SEXO[animal.sexo]} ·{' '}
                {formatarIdade(animal.dataNascimento, animal.idadeAproximada)} ·{' '}
                {PORTE[animal.porte]}
                {animal.raca ? ` · ${animal.raca}` : ''}
              </p>
              <p className="mt-1 text-sm text-tinta-clara">
                Resgatado em {formatarData(animal.dataResgate)}
                {animal.localResgate ? `, em ${animal.localResgate}` : ''} — há{' '}
                {tempoDesde(animal.dataResgate)} com a gente.
              </p>

              {animal.historiaResgate ? (
                <div className="mt-6">
                  <h2 className="titulo-seccao">❤️ A história do {animal.nome}</h2>
                  <p className="mt-2 whitespace-pre-line leading-relaxed text-tinta">
                    {animal.historiaResgate}
                  </p>
                </div>
              ) : null}

              {animal.personalidade ? (
                <div className="mt-5">
                  <h2 className="titulo-seccao">Como ele é</h2>
                  <p className="mt-2 leading-relaxed text-tinta">{animal.personalidade}</p>
                </div>
              ) : null}

              {animal.necessidadeEspecial && animal.descricaoNecessidade ? (
                <div className="mt-5 rounded-xl border border-laranja-200 bg-laranja-50 p-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-laranja-800">
                    Cuidado especial
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-laranja-900">
                    {animal.descricaoNecessidade}
                  </p>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <BotaoCompartilhar nome={animal.nome} url={url} texto={textoCompartilhar} />
                {animal.status === 'DISPONIVEL_ADOCAO' ? (
                  <Link href={`/adotar/${animal.slug}`} className="botao-secundario">
                    🏡 Quero adotar
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {/* ---------- Galeria ---------- */}
          {galeria.length > 0 ? (
            <section className="mt-6">
              <h2 className="titulo-seccao">📸 Fotos e vídeos</h2>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {galeria.map((foto) => (
                  <figure
                    key={foto.id}
                    className="aspect-square overflow-hidden rounded-xl border border-tinta-borda bg-tinta-borda"
                  >
                    {foto.tipo === 'VIDEO' ? (
                      <video
                        src={`/api/foto/${foto.id}`}
                        className="h-full w-full object-cover"
                        controls
                        preload="none"
                      />
                    ) : (
                      <FotoAnimal
                        fotoId={foto.id}
                        nome={animal.nome}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {/* ---------- Saúde ---------- */}
          <section className="mt-6">
            <h2 className="titulo-seccao">🏥 Saúde</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { rotulo: 'Vacinas', valor: String(resumoSaude.vacinas), emoji: '💉' },
                { rotulo: 'Consultas', valor: String(resumoSaude.consultas), emoji: '🩺' },
                { rotulo: 'Castrado', valor: resumoSaude.castrado ? 'Sim' : 'Ainda não', emoji: '✂️' },
                { rotulo: 'Peso atual', valor: formatarPeso(animal.pesoAtualKg), emoji: '⚖️' },
              ].map((s) => (
                <Cartao key={s.rotulo} className="p-4 text-center">
                  <p className="text-lg font-extrabold text-petroleo-900">{s.valor}</p>
                  <p className="mt-0.5 text-xs font-semibold text-tinta-suave">
                    <span aria-hidden>{s.emoji}</span> {s.rotulo}
                  </p>
                </Cartao>
              ))}
            </div>
            <p className="mt-2 text-xs text-tinta-clara">
              O histórico clínico completo fica com a equipe e com o veterinário responsável. Aqui
              mostramos o resumo.
            </p>
          </section>

          {/* ---------- Diário ---------- */}
          {animal.eventosDiario.length > 0 ? (
            <section className="mt-8">
              <h2 className="titulo-seccao">{animal.nome} — minha história</h2>
              <ol className="mt-4 space-y-0">
                {animal.eventosDiario.map((evento, i) => {
                  const tipo = EVENTO_DIARIO[evento.tipo];
                  const ultimo = i === animal.eventosDiario.length - 1;
                  return (
                    <li key={evento.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {/* O fio que liga os eventos. Para no último item,
                          senão a linha do tempo parece continuar no vazio. */}
                      {!ultimo ? (
                        <span
                          aria-hidden
                          className="absolute left-[19px] top-10 bottom-0 w-px bg-tinta-borda"
                        />
                      ) : null}
                      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-tinta-borda bg-white text-base shadow-cartao">
                        {tipo.emoji}
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-tinta-clara">
                          {formatarData(evento.data)}
                        </p>
                        <p className="mt-0.5 font-bold text-petroleo-900">{evento.titulo}</p>
                        {evento.descricao ? (
                          <p className="mt-1 text-sm leading-relaxed text-tinta-suave">
                            {evento.descricao}
                          </p>
                        ) : null}
                        {evento.foto ? (
                          <FotoAnimal
                            fotoId={evento.foto.id}
                            nome={animal.nome}
                            className="mt-3 max-h-56 w-full rounded-xl border border-tinta-borda object-cover"
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}
        </div>

        {/* ---------- Coluna do apadrinhamento ---------- */}
        <aside className="lg:sticky lg:top-24">
          <Cartao className="border-laranja-200">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-petroleo-900">
              <span className="text-laranja-500">
                <IconeCoracaoCheio tamanho={22} />
              </span>
              Apadrinhe o {animal.nome}
            </h2>
            <p className="mt-1 text-sm text-tinta-suave">Custo médio mensal de cuidar dele:</p>

            <dl className="mt-4 space-y-2 text-sm">
              {[
                { emoji: '🍖', rotulo: 'Alimentação', valor: custo.alimentacao },
                { emoji: '🏥', rotulo: 'Tratamento', valor: custo.tratamento },
                { emoji: '💊', rotulo: 'Medicamentos', valor: custo.medicamento },
              ].map((l) => (
                <div key={l.rotulo} className="flex items-baseline justify-between gap-3">
                  <dt className="text-tinta-suave">
                    <span aria-hidden>{l.emoji}</span> {l.rotulo}
                  </dt>
                  <dd className="tabular-nums font-semibold text-tinta">{reais(l.valor)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 border-t border-tinta-borda pt-2">
                <dt className="font-bold text-petroleo-900">Total</dt>
                <dd className="tabular-nums text-lg font-extrabold text-petroleo-900">
                  {reais(custo.total)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-xl bg-tinta-fundo p-4">
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="font-bold tabular-nums text-laranja-700">
                  {reais(custo.apoiado)} já arrecadado
                </span>
                <span className="tabular-nums text-tinta-suave">{porcento(custo.percentual)}</span>
              </div>
              <BarraMeta
                percentual={custo.percentual}
                altura="h-3"
                rotulo={`Apoio mensal de ${animal.nome}`}
              />
              <p className="mt-2 text-sm font-semibold text-tinta-suave">
                {custo.falta > 0
                  ? `Faltam ${reais(custo.falta)} por mês para o ${animal.nome} estar completo.`
                  : `O ${animal.nome} está com o custo mensal coberto. Obrigado. 🎉`}
              </p>
            </div>

            <Link href={`/animais/${animal.slug}/apadrinhar`} className="botao-doar mt-5 w-full">
              ❤️ Apadrinhar o {animal.nome}
            </Link>
            <p className="mt-2 text-center text-xs text-tinta-clara">
              A partir de {reaisCurto(30)}/mês. Você pode cancelar quando quiser.
            </p>
          </Cartao>

          {/* ---------- Campanha de emergência ---------- */}
          {campanhas.map((c) => (
            <Cartao key={c.id} className="mt-4 border-rose-200 bg-rose-50/60">
              <Selo classe="bg-rose-600 text-white">🚨 Emergência</Selo>
              <h3 className="mt-2 text-lg font-extrabold text-petroleo-900">{c.titulo}</h3>
              <p className="mt-1 text-sm text-tinta-suave">{c.resumo}</p>
              <div className="mt-3">
                <BarraMeta percentual={(c.arrecadado / c.meta) * 100} rotulo={c.titulo} />
                <p className="mt-1.5 text-xs font-semibold tabular-nums text-tinta-suave">
                  {reaisCurto(c.arrecadado)} de {reaisCurto(c.meta)}
                </p>
              </div>
              <Link href={`/campanhas/${c.slug}`} className="botao-doar mt-4 w-full">
                ❤️ Quero ajudar
              </Link>
            </Cartao>
          ))}

          {/* ---------- Últimas notícias ---------- */}
          {animal.atualizacoes.length > 0 ? (
            <Cartao className="mt-4">
              <h3 className="titulo-seccao">Como o {animal.nome} está</h3>
              <ul className="mt-3 space-y-4">
                {animal.atualizacoes.map((a) => (
                  <li key={a.id}>
                    <p className="text-xs font-bold uppercase tracking-wide text-tinta-clara">
                      {formatarData(a.criadaEm)}
                    </p>
                    <p className="mt-0.5 font-bold text-petroleo-900">{a.titulo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-tinta-suave">{a.texto}</p>
                  </li>
                ))}
              </ul>
            </Cartao>
          ) : null}

          {/* ---------- Mural de padrinhos ---------- */}
          {padrinhosVisiveis.length > 0 ? (
            <Cartao className="mt-4">
              <h3 className="titulo-seccao">Quem cuida do {animal.nome}</h3>
              <ul className="mt-3 space-y-2">
                {padrinhosVisiveis.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                      <RetratoGerado nome={a.padrinho.nome} className="h-full w-full" />
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="block truncate font-semibold text-tinta">
                        {a.padrinho.nome}
                      </span>
                      <span className="text-xs text-tinta-clara">
                        AUmigo há {tempoDesde(a.inicio)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Cartao>
          ) : null}

          <p className="mt-4 px-1 text-center text-xs text-tinta-clara">{config.frase}</p>
        </aside>
      </div>
    </article>
  );
}
