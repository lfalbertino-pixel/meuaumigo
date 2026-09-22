import type { Metadata } from 'next';
import Link from 'next/link';
import { GraficoBarras, GraficoDonut } from '@/components/Graficos';
import { CORES } from '@/lib/paleta';
import { BarraMeta, Cartao, Indicador, Tabela, TituloPagina } from '@/components/ui';
import { exigirEquipe } from '@/lib/auth';
import { MODALIDADE, formatarData, numero, porcento, reais, reaisCurto } from '@/lib/format';
import { carregarRelatorios } from '@/server/relatorios';
import { carregarImpacto } from '@/server/painel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Relatórios' };

export default async function Relatorios() {
  await exigirEquipe();
  const [r, impacto] = await Promise.all([carregarRelatorios(12), carregarImpacto()]);

  const cobertura = r.metaMensalTotal > 0 ? (r.apoioMensalTotal / r.metaMensalTotal) * 100 : 0;
  const saldoRetencao = r.retencao.reduce((s, m) => s + m.valores.saldo, 0);

  return (
    <>
      <TituloPagina
        titulo="Relatórios"
        descricao="Os 12 meses que explicam onde a ONG está e para onde ela caminha."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          emoji="🎯"
          rotulo="Cobertura do custo mensal"
          valor={porcento(cobertura)}
          detalhe={`${reaisCurto(r.apoioMensalTotal)} de ${reaisCurto(r.metaMensalTotal)}`}
          destaque
        />
        <Indicador
          emoji="📉"
          rotulo="Inadimplência (12 meses)"
          valor={porcento(r.taxaInadimplencia)}
          detalhe={`${reaisCurto(r.totalLancado - r.totalPago)} não pagos`}
        />
        <Indicador
          emoji={saldoRetencao >= 0 ? '📈' : '⚠️'}
          rotulo="Saldo de padrinhos"
          valor={`${saldoRetencao >= 0 ? '+' : ''}${numero(saldoRetencao)}`}
          detalhe="novos menos cancelados, 12 meses"
        />
        <Indicador emoji="🏡" rotulo="Adoções concluídas" valor={numero(impacto.adotados)} />
      </section>

      <section className="mb-4 grid gap-4 xl:grid-cols-2">
        <Cartao>
          <h2 className="titulo-seccao">Cobrado x recebido</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            A distância entre as barras é a inadimplência. Ela costuma abrir quando ninguém manda
            novidade dos animais por dois meses.
          </p>
          <div className="mt-4">
            <GraficoBarras
              dados={r.cobranca}
              series={[
                { chave: 'lancado', rotulo: 'Cobrado', cor: CORES.saida },
                { chave: 'pago', rotulo: 'Recebido', cor: CORES.entrada },
              ]}
            />
          </div>
        </Cartao>

        <Cartao>
          <h2 className="titulo-seccao">Entrada e saída de padrinhos</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            O número mais importante do longo prazo. Cancelamento acima de novo, dois meses
            seguidos, pede ação — não relatório.
          </p>
          <div className="mt-4">
            <GraficoBarras
              dados={r.retencao}
              formato="inteiro"
              series={[
                { chave: 'novos', rotulo: 'Novos', cor: '#008a7c' },
                { chave: 'cancelados', rotulo: 'Cancelados', cor: '#c33a6b' },
              ]}
            />
          </div>
        </Cartao>
      </section>

      <section className="mb-4 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Cartao>
          <h2 className="titulo-seccao">Receita por modalidade</h2>
          <div className="mt-4">
            <GraficoDonut
              dados={r.modalidades.map((m, i) => ({
                rotulo: MODALIDADE[m.modalidade as keyof typeof MODALIDADE] ?? m.modalidade,
                valor: m.valor,
                cor: CORES.serie[i % CORES.serie.length],
              }))}
            />
          </div>
          <ul className="mt-4 space-y-1 text-xs text-tinta-suave">
            {r.modalidades.map((m) => (
              <li key={m.modalidade}>
                {MODALIDADE[m.modalidade as keyof typeof MODALIDADE] ?? m.modalidade}:{' '}
                {m.quantidade} {m.quantidade === 1 ? 'apadrinhamento' : 'apadrinhamentos'}
              </li>
            ))}
          </ul>
        </Cartao>

        <Cartao>
          <h2 className="titulo-seccao">Animais mais caros (12 meses)</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            Gasto real lançado, não estimativa. Serve para revisar o custo mensal do cadastro — e
            para decidir quando abrir campanha.
          </p>
          <ul className="mt-4 space-y-2.5">
            {r.maioresCustos.map((m) => {
              const maximo = r.maioresCustos[0]?.valor || 1;
              return (
                <li key={m.id}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <Link
                      href={`/animais-ong/${m.id}`}
                      className="truncate font-semibold text-tinta hover:text-laranja-600"
                    >
                      {m.nome}
                    </Link>
                    <span className="shrink-0 tabular-nums font-bold text-petroleo-800">
                      {reais(m.valor)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-tinta-borda">
                    <div
                      className="h-full rounded-full bg-petroleo-500"
                      style={{ width: `${(m.valor / maximo) * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {r.maioresCustos.length === 0 ? (
              <li className="text-sm text-tinta-clara">Nenhuma despesa por animal no período.</li>
            ) : null}
          </ul>
        </Cartao>
      </section>

      <section>
        <h2 className="titulo-seccao mb-2">Animais com o custo descoberto</h2>
        <p className="mb-2 text-sm text-tinta-suave">
          Ordenados pelo que falta. É daqui que sai a lista de quem divulgar primeiro.
        </p>
        <Tabela
          cabecalho={['Animal', 'Resgatado em', 'Custo mensal', 'Apoiado', 'Falta', 'Cobertura']}
          vazio={r.descobertos.length === 0 ? 'Todos os animais estão com o custo coberto. 🎉' : undefined}
        >
          {r.descobertos.map((a) => (
            <tr key={a.id} className="transition hover:bg-tinta-fundo/60">
              <td className="px-4 py-2.5">
                <Link
                  href={`/animais-ong/${a.id}`}
                  className="font-bold text-petroleo-900 hover:text-laranja-600"
                >
                  {a.nome}
                </Link>
                <span className="block text-xs text-tinta-clara">
                  {a.padrinhos === 0
                    ? 'sem padrinho'
                    : `${a.padrinhos} ${a.padrinhos === 1 ? 'padrinho' : 'padrinhos'}`}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs tabular-nums text-tinta-suave">
                {formatarData(a.dataResgate)}
              </td>
              <td className="px-4 py-2.5 tabular-nums text-sm">{reais(a.total)}</td>
              <td className="px-4 py-2.5 tabular-nums text-sm text-emerald-700">{reais(a.apoiado)}</td>
              <td className="px-4 py-2.5 tabular-nums text-sm font-extrabold text-laranja-700">
                {reais(a.falta)}
              </td>
              <td className="px-4 py-2.5">
                <span className="block w-28">
                  <BarraMeta percentual={a.percentual} altura="h-2" rotulo={`Cobertura de ${a.nome}`} />
                </span>
              </td>
            </tr>
          ))}
        </Tabela>
      </section>
    </>
  );
}
