import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FotoAnimal } from '@/components/FotoAnimal';
import { BarraMeta, Cartao, Indicador, Selo, TituloPagina, Vazio } from '@/components/ui';
import { IconeRelogio, IconeSino } from '@/components/Icones';
import { exigirPadrinho } from '@/lib/auth';
import {
  STATUS_ANIMAL,
  STATUS_CONTRIBUICAO,
  formatarData,
  formatarIdade,
  formatarMesAno,
  porcento,
  primeiroNome,
  reais,
  reaisCurto,
} from '@/lib/format';
import { carregarMeusAumigos, marcarNotificacoesLidas } from '@/server/padrinho';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Meus AUmigos', robots: { index: false, follow: false } };

export default async function MeusAumigos() {
  const usuario = await exigirPadrinho();
  const dados = await carregarMeusAumigos(usuario.padrinhoId);
  if (!dados) notFound();

  const ativos = dados.apadrinhamentos.filter((a) => a.status === 'ATIVO');
  const encerrados = dados.apadrinhamentos.filter((a) => a.status !== 'ATIVO');

  // Abrir esta tela é ler as novidades. Marcar aqui evita um badge que
  // nunca zera — e ninguém volta a uma tela que continua pedindo atenção.
  await marcarNotificacoesLidas(usuario.padrinhoId);

  return (
    <>
      <TituloPagina
        titulo={`Olá, ${primeiroNome(dados.padrinho.nome)}! 🐾`}
        descricao={
          ativos.length > 0
            ? `Você ajuda ${ativos.length} ${ativos.length === 1 ? 'AUmigo' : 'AUmigos'} neste momento. Obrigado por isso.`
            : 'Você ainda não apadrinha nenhum AUmigo. Que tal conhecer quem está esperando?'
        }
      />

      {dados.emAberto.length > 0 ? (
        <div className="mb-5 rounded-caixa border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">
            Você tem {dados.emAberto.length}{' '}
            {dados.emAberto.length === 1 ? 'mensalidade em aberto' : 'mensalidades em aberto'}.
          </p>
          <p className="mt-1 text-sm text-amber-900/80">
            Assim que o pagamento for confirmado pela equipe, ele aparece aqui como pago.{' '}
            <Link href="/meus-aumigos/contribuicoes" className="font-bold underline">
              Ver detalhes
            </Link>
          </p>
        </div>
      ) : null}

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Indicador emoji="❤️" rotulo="AUmigos apadrinhados" valor={String(ativos.length)} />
        <Indicador
          emoji="💰"
          rotulo="Sua contribuição"
          valor={`${reaisCurto(dados.mensal)}/mês`}
          destaque
        />
        <Indicador
          emoji="🏆"
          rotulo="Já destinados por você"
          valor={reaisCurto(dados.totalPago)}
          detalhe="pagamentos confirmados"
        />
      </section>

      {ativos.length === 0 ? (
        <Vazio
          emoji="🐾"
          titulo="Nenhum AUmigo apadrinhado"
          descricao="Tem muita gente de quatro patas esperando alguém assumir a conta do mês."
          acao={
            <Link href="/animais?apadrinhamento=precisa" className="botao-doar">
              Conhecer os AUmigos
            </Link>
          }
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {ativos.map((a) => {
            const status = STATUS_ANIMAL[a.animal.status];
            return (
              <Cartao key={a.id} padding={false} className="overflow-hidden">
                <Link href={`/meus-aumigos/${a.animal.slug}`} className="flex gap-4 p-4">
                  <span className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-tinta-borda">
                    <FotoAnimal
                      fotoId={a.animal.fotoCapaId}
                      nome={a.animal.nome}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-extrabold text-petroleo-900">
                      {a.animal.nome}
                    </span>
                    <span className="mt-0.5 block text-xs text-tinta-suave">
                      {formatarIdade(a.animal.dataNascimento, a.animal.idadeAproximada)}
                    </span>
                    <span className="mt-1.5 block">
                      <Selo classe={status.classe}>
                        {status.ponto} {status.rotulo}
                      </Selo>
                    </span>
                    <span className="mt-2 block text-sm font-bold text-laranja-700">
                      Apadrinhamento: {reais(a.valorMensal)}/mês
                    </span>
                  </span>
                </Link>

                <div className="border-t border-tinta-borda/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-tinta-clara">
                    Como o {a.animal.nome} está
                  </p>
                  {a.ultimaAtualizacao ? (
                    <>
                      <p className="mt-1 text-sm font-semibold text-tinta">
                        {a.ultimaAtualizacao.titulo}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-tinta-suave">
                        {a.ultimaAtualizacao.texto}
                      </p>
                      <p className="mt-1 text-xs text-tinta-clara">
                        atualizado em {formatarData(a.ultimaAtualizacao.criadaEm)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-tinta-suave">
                      Ainda não há novidades. Assim que a equipe registrar algo sobre o{' '}
                      {a.animal.nome}, você recebe por aqui.
                    </p>
                  )}

                  {a.proximaConsulta?.proximaData ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-petroleo-700">
                      <IconeRelogio tamanho={13} />
                      Próxima consulta: {formatarData(a.proximaConsulta.proximaData)}
                    </p>
                  ) : null}

                  <div className="mt-3">
                    <div className="mb-1 flex items-baseline justify-between text-xs">
                      <span className="font-bold text-petroleo-800">
                        {porcento(a.custo.percentual)} do custo dele coberto
                      </span>
                      <span className="tabular-nums text-tinta-suave">
                        {a.custo.padrinhos}{' '}
                        {a.custo.padrinhos === 1 ? 'padrinho' : 'padrinhos'}
                      </span>
                    </div>
                    <BarraMeta
                      percentual={a.custo.percentual}
                      altura="h-2"
                      rotulo={`Apoio de ${a.animal.nome}`}
                    />
                  </div>

                  <p className="mt-3 text-xs text-tinta-suave">
                    🐾 Você é AUmigo do {a.animal.nome} há{' '}
                    <strong>
                      {a.mesesDeAmizade === 0
                        ? 'menos de um mês'
                        : `${a.mesesDeAmizade} ${a.mesesDeAmizade === 1 ? 'mês' : 'meses'}`}
                    </strong>{' '}
                    ❤️
                  </p>

                  <Link
                    href={`/meus-aumigos/${a.animal.slug}`}
                    className="botao-secundario mt-3 w-full"
                  >
                    Ver tudo sobre o {a.animal.nome}
                  </Link>
                </div>
              </Cartao>
            );
          })}
        </section>
      )}

      {/* ---------- Notificações ---------- */}
      {dados.notificacoes.length > 0 ? (
        <section className="mt-8">
          <h2 className="titulo-seccao flex items-center gap-2">
            <IconeSino tamanho={15} /> Novidades
          </h2>
          <ul className="mt-3 space-y-2">
            {dados.notificacoes.slice(0, 8).map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? '/meus-aumigos'}
                  className="cartao flex items-start gap-3 p-3.5 transition hover:border-petroleo-300"
                >
                  <span className="mt-0.5 text-lg" aria-hidden>
                    {n.tipo === 'ATUALIZACAO_ANIMAL'
                      ? '🐶'
                      : n.tipo === 'APADRINHAMENTO_CONFIRMADO'
                        ? '❤️'
                        : n.tipo === 'ANIVERSARIO'
                          ? '🎉'
                          : n.tipo === 'CONQUISTA'
                            ? '🏆'
                            : '🔔'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-petroleo-900">{n.titulo}</span>
                    <span className="block text-sm text-tinta-suave">{n.corpo}</span>
                    <span className="mt-0.5 block text-xs text-tinta-clara">
                      {formatarData(n.criadaEm)}
                      {n.animal ? ` · ${n.animal.nome}` : ''}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ---------- Encerrados ---------- */}
      {encerrados.length > 0 ? (
        <section className="mt-8">
          <h2 className="titulo-seccao">Apadrinhamentos encerrados</h2>
          <ul className="mt-3 space-y-2">
            {encerrados.map((a) => (
              <li key={a.id} className="cartao flex items-center justify-between gap-3 p-3.5">
                <span className="text-sm">
                  <span className="font-bold text-tinta">{a.animal.nome}</span>
                  <span className="block text-xs text-tinta-clara">
                    de {formatarData(a.inicio)} a {a.fim ? formatarData(a.fim) : '—'}
                  </span>
                </span>
                <span className="text-xs font-bold text-tinta-clara">
                  {a.status === 'PAUSADO' ? 'pausado' : 'encerrado'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-center text-xs text-tinta-clara">
        Competência atual: {formatarMesAno(new Date())} ·{' '}
        {dados.emAberto.length === 0
          ? 'nenhuma mensalidade em aberto'
          : `${STATUS_CONTRIBUICAO[dados.emAberto[0].status].rotulo.toLowerCase()} desde ${formatarData(dados.emAberto[0].competencia)}`}
      </p>
    </>
  );
}
