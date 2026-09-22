import type { Metadata } from 'next';
import Link from 'next/link';
import { GraficoBarras, GraficoDonut } from '@/components/Graficos';
import { CORES, corDaCategoria } from '@/lib/paleta';
import { BarraMeta, Cartao, Indicador, Selo, TituloPagina } from '@/components/ui';
import { IconeAlerta, IconeRelogio } from '@/components/Icones';
import {
  CATEGORIA_DESPESA,
  TIPO_SAUDE,
  formatarData,
  formatarMesAno,
  numero,
  porcento,
  primeiroNome,
  reais,
  reaisCurto,
} from '@/lib/format';
import { exigirEquipe } from '@/lib/auth';
import { carregarPainel } from '@/server/painel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Painel' };

export default async function Painel() {
  const [usuario, painel] = await Promise.all([exigirEquipe(), carregarPainel(12)]);
  const c = painel.cartoes;
  const saldo = c.arrecadadoMes - c.despesasMes;

  return (
    <>
      <TituloPagina
        titulo={`Olá, ${primeiroNome(usuario.nome)}! 🐾`}
        descricao={`Como está o ${formatarMesAno(painel.mesAtual)} no abrigo.`}
        acao={
          <Link href="/animais-ong/novo" className="botao-primario">
            + Cadastrar animal
          </Link>
        }
      />

      {/* ---------- Os números do mês ---------- */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Indicador
          emoji="🐶"
          rotulo="Animais ativos"
          valor={numero(c.animaisAtivos)}
          detalhe={
            <Link href="/animais-ong" className="hover:text-petroleo-700">
              ver todos →
            </Link>
          }
        />
        <Indicador
          emoji="❤️"
          rotulo="Apadrinhados"
          valor={numero(c.animaisApadrinhados)}
          detalhe={
            c.animaisAtivos > 0
              ? `${porcento((c.animaisApadrinhados / c.animaisAtivos) * 100)} dos ativos`
              : undefined
          }
        />
        <Indicador
          emoji="👥"
          rotulo="Padrinhos ativos"
          valor={numero(c.padrinhosAtivos)}
          detalhe={
            <Link href="/padrinhos" className="hover:text-petroleo-700">
              ver padrinhos →
            </Link>
          }
        />
        <Indicador
          emoji="💰"
          rotulo="Arrecadado no mês"
          valor={reaisCurto(c.arrecadadoMes)}
          destaque
          detalhe={`saldo ${saldo >= 0 ? '+' : ''}${reaisCurto(saldo)}`}
        />
        <Indicador
          emoji="🏥"
          rotulo="Despesa veterinária"
          valor={reaisCurto(c.despesasVetMes)}
          detalhe={`de ${reaisCurto(c.despesasMes)} no total`}
        />
      </section>

      {/* ---------- O que precisa de atenção ---------- */}
      <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {c.semPadrinho > 0 ? (
          <Link href="/animais-ong?filtro=sem-padrinho" className="block">
            <Cartao className="h-full border-laranja-200 bg-laranja-50/60 transition hover:shadow-flutuante">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-laranja-800">
                <IconeAlerta tamanho={15} /> Sem padrinho
              </p>
              <p className="mt-2 text-2xl font-extrabold text-laranja-800">{numero(c.semPadrinho)}</p>
              <p className="mt-0.5 text-xs text-laranja-900/80">
                animais ativos que ninguém apadrinhou ainda
              </p>
            </Cartao>
          </Link>
        ) : null}

        {c.inadimplenciaCount > 0 ? (
          <Link href="/financeiro?filtro=pendentes" className="block">
            <Cartao className="h-full border-rose-200 bg-rose-50/60 transition hover:shadow-flutuante">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-800">
                <IconeAlerta tamanho={15} /> Em aberto
              </p>
              <p className="mt-2 text-2xl font-extrabold text-rose-800">
                {reaisCurto(c.inadimplenciaValor)}
              </p>
              <p className="mt-0.5 text-xs text-rose-900/80">
                {c.inadimplenciaCount} mensalidades pendentes ou atrasadas
              </p>
            </Cartao>
          </Link>
        ) : null}

        {painel.estoqueBaixo.length > 0 ? (
          <Link href="/alimentacao" className="block">
            <Cartao className="h-full border-amber-200 bg-amber-50/60 transition hover:shadow-flutuante">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-800">
                <IconeAlerta tamanho={15} /> Estoque baixo
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {painel.estoqueBaixo.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span className="truncate font-semibold">{item.nome}</span>
                    <span className="tabular-nums">
                      {numero(item.saldo)} {item.unidade}
                    </span>
                  </li>
                ))}
              </ul>
            </Cartao>
          </Link>
        ) : null}
      </section>

      {/* ---------- Gráficos ---------- */}
      <section className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Cartao>
          <h2 className="titulo-seccao">Arrecadação x despesas</h2>
          <p className="mt-1 text-sm text-tinta-suave">Últimos 12 meses, por competência.</p>
          <div className="mt-4">
            <GraficoBarras
              dados={painel.fluxo}
              series={[
                { chave: 'entrada', rotulo: 'Arrecadado', cor: CORES.entrada },
                { chave: 'saida', rotulo: 'Despesas', cor: CORES.saida },
              ]}
            />
          </div>
        </Cartao>

        <Cartao>
          <h2 className="titulo-seccao">Despesas do mês</h2>
          <p className="mt-1 text-sm text-tinta-suave">{formatarMesAno(painel.mesAtual)}</p>
          <div className="mt-4">
            <GraficoDonut
              dados={painel.despesasPorCategoria.map((d) => ({
                rotulo: CATEGORIA_DESPESA[d.categoria as keyof typeof CATEGORIA_DESPESA] ?? d.categoria,
                valor: d.valor,
                cor: corDaCategoria(d.categoria),
              }))}
            />
          </div>
        </Cartao>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <Cartao>
          <h2 className="titulo-seccao">Custeio: veterinário, ração e medicamento</h2>
          <div className="mt-4">
            <GraficoBarras
              dados={painel.custeio}
              series={[
                { chave: 'veterinario', rotulo: 'Veterinário', cor: '#008a7c' },
                { chave: 'alimentacao', rotulo: 'Alimentação', cor: '#e8860a' },
                { chave: 'medicamento', rotulo: 'Medicamentos', cor: '#c33a6b' },
              ]}
            />
          </div>
        </Cartao>

        <Cartao>
          <h2 className="titulo-seccao">Padrinhos: novos x cancelamentos</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            A linha que mais importa no longo prazo. Cancelamento acima de novo, dois meses
            seguidos, é o sinal de alerta.
          </p>
          <div className="mt-4">
            <GraficoBarras
              dados={painel.padrinhos}
              formato="inteiro"
              series={[
                { chave: 'novos', rotulo: 'Novos', cor: '#008a7c' },
                { chave: 'cancelados', rotulo: 'Cancelados', cor: '#c33a6b' },
              ]}
            />
          </div>
        </Cartao>
      </section>

      {/* ---------- Agenda e campanhas ---------- */}
      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <Cartao>
          <h2 className="titulo-seccao">Próximos compromissos de saúde</h2>
          {painel.proximasConsultas.length === 0 ? (
            <p className="mt-3 text-sm text-tinta-clara">Nada agendado.</p>
          ) : (
            <ul className="mt-3 divide-y divide-tinta-borda/70">
              {painel.proximasConsultas.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <Link
                      href={`/animais-ong/${r.animal.id}`}
                      className="block truncate font-bold text-petroleo-900 hover:text-laranja-600"
                    >
                      {r.animal.nome}
                    </Link>
                    <span className="text-xs text-tinta-suave">
                      {TIPO_SAUDE[r.tipo]} · {r.titulo}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-petroleo-700">
                    <IconeRelogio tamanho={14} />
                    {formatarData(r.proximaData)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao>
          <div className="flex items-center justify-between">
            <h2 className="titulo-seccao">Campanhas abertas</h2>
            <Link href="/campanhas-ong" className="text-xs font-bold text-laranja-600 hover:underline">
              gerenciar
            </Link>
          </div>
          {painel.campanhas.length === 0 ? (
            <p className="mt-3 text-sm text-tinta-clara">Nenhuma campanha ativa.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {painel.campanhas.map((c) => (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      href={`/campanhas/${c.slug}`}
                      className="truncate font-bold text-petroleo-900 hover:text-laranja-600"
                    >
                      {c.urgente ? '🚨 ' : ''}
                      {c.titulo}
                    </Link>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-tinta-suave">
                      {reaisCurto(c.arrecadado)} / {reaisCurto(c.meta)}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <BarraMeta percentual={(c.arrecadado / c.meta) * 100} altura="h-2" rotulo={c.titulo} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </section>

      {c.adocoesEmAndamento > 0 ? (
        <section className="mt-4">
          <Link href="/adocoes">
            <Cartao className="flex items-center justify-between gap-4 transition hover:shadow-flutuante">
              <span>
                <span className="block font-bold text-petroleo-900">
                  🏡 {c.adocoesEmAndamento}{' '}
                  {c.adocoesEmAndamento === 1
                    ? 'processo de adoção em andamento'
                    : 'processos de adoção em andamento'}
                </span>
                <span className="text-sm text-tinta-suave">
                  Interesse, entrevista, visita ou aprovação pendente.
                </span>
              </span>
              <Selo>ver adoções →</Selo>
            </Cartao>
          </Link>
        </section>
      ) : null}

      <p className="mt-6 text-center text-xs text-tinta-clara">
        Valores de {formatarMesAno(painel.mesAtual)} · arrecadação contada por competência, despesa
        por data de lançamento · total do mês {reais(c.arrecadadoMes)}
      </p>
    </>
  );
}
