import type { Metadata } from 'next';
import Link from 'next/link';
import { GraficoBarras, GraficoDonut } from '@/components/Graficos';
import { CORES, corDaCategoria } from '@/lib/paleta';
import { Cartao, Indicador, Selo, Tabela, TituloPagina } from '@/components/ui';
import { db } from '@/lib/db';
import { exigirAdmin } from '@/lib/auth';
import {
  CATEGORIA_DESPESA,
  METODO,
  STATUS_CONTRIBUICAO,
  formatarData,
  formatarMesAno,
  paraNumero,
  reais,
  reaisCurto,
} from '@/lib/format';
import { carregarPainel } from '@/server/painel';
import { inicioDoMes, fimDoMes } from '@/server/periodo';
import { BotaoConfirmar, FormularioDespesa, RotinaDoMes } from './Painel';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Financeiro' };

export default async function Financeiro({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const usuario = await exigirAdmin();
  const { filtro = 'pendentes' } = await searchParams;

  const mes = inicioDoMes();
  const proximo = fimDoMes();

  const [painel, entradas, despesas, animais] = await Promise.all([
    carregarPainel(12),
    db.contribuicao.findMany({
      where:
        filtro === 'pendentes'
          ? { status: { in: ['PENDENTE', 'ATRASADA'] } }
          : filtro === 'mes'
            ? { competencia: { gte: mes, lt: proximo } }
            : {},
      orderBy: [{ status: 'asc' }, { competencia: 'desc' }],
      take: 120,
      include: {
        padrinho: { select: { id: true, nome: true } },
        animal: { select: { id: true, nome: true } },
        campanha: { select: { titulo: true } },
      },
    }),
    db.despesa.findMany({
      where: { data: { gte: mes, lt: proximo } },
      orderBy: { data: 'desc' },
      take: 60,
      include: {
        animal: { select: { id: true, nome: true } },
        comprovantes: { select: { id: true, titulo: true, publico: true } },
      },
    }),
    db.animal.findMany({
      where: { deletadoEm: null, ativo: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    }),
  ]);

  const c = painel.cartoes;
  const saldo = c.arrecadadoMes - c.despesasMes;
  const somaDespesasMes = despesas.reduce((s, d) => s + paraNumero(d.valor), 0);

  return (
    <>
      <TituloPagina
        titulo="Financeiro"
        descricao={`Competência de ${formatarMesAno(mes)}. Arrecadação conta por competência; despesa, por data do lançamento.`}
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador emoji="💰" rotulo="Arrecadado no mês" valor={reaisCurto(c.arrecadadoMes)} destaque />
        <Indicador emoji="🧾" rotulo="Despesas do mês" valor={reaisCurto(c.despesasMes)} />
        <Indicador
          emoji={saldo >= 0 ? '📈' : '📉'}
          rotulo="Saldo do mês"
          valor={`${saldo >= 0 ? '+' : ''}${reaisCurto(saldo)}`}
          detalhe={saldo >= 0 ? 'no azul' : 'no vermelho'}
        />
        <Indicador
          emoji="⏳"
          rotulo="Em aberto"
          valor={reaisCurto(c.inadimplenciaValor)}
          detalhe={`${c.inadimplenciaCount} lançamentos`}
        />
      </section>

      <section className="mb-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Cartao>
          <h2 className="titulo-seccao">Entradas x saídas (12 meses)</h2>
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
          <h2 className="titulo-seccao">Despesas do mês por categoria</h2>
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

      <div className="mb-4">
        <RotinaDoMes ehAdmin={usuario.papel === 'ADMIN'} />
      </div>

      {/* ---------- Entradas ---------- */}
      <section className="mb-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="titulo-seccao">Entradas</h2>
          <div className="flex gap-2">
            {[
              { chave: 'pendentes', rotulo: 'Em aberto' },
              { chave: 'mes', rotulo: 'Deste mês' },
              { chave: 'todas', rotulo: 'Todas' },
            ].map((f) => (
              <Link
                key={f.chave}
                href={`/financeiro?filtro=${f.chave}`}
                aria-current={filtro === f.chave ? 'true' : undefined}
                className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                  filtro === f.chave
                    ? 'border-petroleo-800 bg-petroleo-800 text-white'
                    : 'border-tinta-borda bg-white text-tinta-suave hover:border-petroleo-300'
                }`}
              >
                {f.rotulo}
              </Link>
            ))}
          </div>
        </div>

        <Tabela
          cabecalho={['Competência', 'Quem', 'Destino', 'Valor', 'Status', '']}
          vazio={entradas.length === 0 ? 'Nada nesta visão.' : undefined}
        >
          {entradas.map((e) => (
            <tr key={e.id} className="transition hover:bg-tinta-fundo/60">
              <td className="px-4 py-2.5 text-sm capitalize text-tinta-suave">
                {formatarMesAno(e.competencia)}
                {e.vencimento ? (
                  <span className="block text-xs text-tinta-clara">
                    vence {formatarData(e.vencimento)}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-2.5 text-sm">
                {e.padrinho ? (
                  <Link
                    href={`/padrinhos/${e.padrinho.id}`}
                    className="font-semibold text-petroleo-900 hover:text-laranja-600"
                  >
                    {e.padrinho.nome}
                  </Link>
                ) : (
                  <span className="text-tinta">{e.nomeDoador ?? (e.anonima ? 'Anônimo' : '—')}</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-tinta-suave">
                {e.campanha ? (
                  <>🚨 {e.campanha.titulo}</>
                ) : e.animal ? (
                  <Link href={`/animais-ong/${e.animal.id}`} className="hover:text-laranja-600">
                    🐾 {e.animal.nome}
                  </Link>
                ) : (
                  'Abrigo'
                )}
              </td>
              <td className="px-4 py-2.5 tabular-nums font-extrabold text-petroleo-800">
                {reais(e.valor)}
              </td>
              <td className="px-4 py-2.5">
                <Selo classe={STATUS_CONTRIBUICAO[e.status].classe}>
                  {STATUS_CONTRIBUICAO[e.status].rotulo}
                </Selo>
                {e.metodo ? (
                  <span className="mt-1 block text-[11px] text-tinta-clara">{METODO[e.metodo]}</span>
                ) : null}
              </td>
              <td className="px-4 py-2.5">
                {e.status === 'PENDENTE' || e.status === 'ATRASADA' ? (
                  <BotaoConfirmar id={e.id} />
                ) : null}
              </td>
            </tr>
          ))}
        </Tabela>
      </section>

      {/* ---------- Saídas ---------- */}
      <section>
        <h2 className="titulo-seccao mb-2">Despesas de {formatarMesAno(mes)}</h2>
        <div className="mb-4">
          <FormularioDespesa animais={animais} />
        </div>

        <Tabela
          cabecalho={['Data', 'Descrição', 'Categoria', 'Animal', 'Valor', 'Comprovante']}
          vazio={despesas.length === 0 ? 'Nenhuma despesa lançada neste mês.' : undefined}
        >
          {despesas.map((d) => (
            <tr key={d.id} className="transition hover:bg-tinta-fundo/60">
              <td className="px-4 py-2.5 text-sm tabular-nums text-tinta-suave">
                {formatarData(d.data)}
              </td>
              <td className="px-4 py-2.5 text-sm">
                <span className="font-semibold text-tinta">{d.descricao}</span>
                {d.fornecedor ? (
                  <span className="block text-xs text-tinta-clara">{d.fornecedor}</span>
                ) : null}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className="selo"
                  style={{ background: `${corDaCategoria(d.categoria)}1a`, color: corDaCategoria(d.categoria) }}
                >
                  {CATEGORIA_DESPESA[d.categoria]}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-tinta-suave">
                {d.animal ? (
                  <Link href={`/animais-ong/${d.animal.id}`} className="hover:text-laranja-600">
                    {d.animal.nome}
                  </Link>
                ) : (
                  'Abrigo'
                )}
              </td>
              <td className="px-4 py-2.5 tabular-nums font-semibold">{reais(d.valor)}</td>
              <td className="px-4 py-2.5 text-xs">
                {d.comprovantes.length === 0 ? (
                  <span className="text-tinta-clara">—</span>
                ) : (
                  d.comprovantes.map((c) => (
                    <a
                      key={c.id}
                      href={`/api/comprovante/${c.id}`}
                      target="_blank"
                      rel="noopener"
                      className="block font-bold text-petroleo-600 hover:underline"
                    >
                      📄 {c.publico ? 'público' : 'interno'}
                    </a>
                  ))
                )}
              </td>
            </tr>
          ))}
        </Tabela>

        <p className="mt-3 text-right text-sm font-bold text-petroleo-900">
          Soma exibida: <span className="tabular-nums">{reais(somaDespesasMes)}</span>
        </p>
      </section>
    </>
  );
}
