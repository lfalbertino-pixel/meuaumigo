import type { Metadata } from 'next';
import Link from 'next/link';
import { Medidor } from '@/components/Graficos';
import { CORES } from '@/lib/paleta';
import { Cartao, Indicador, Tabela, TituloPagina, Vazio } from '@/components/ui';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import { TIPO_ITEM, formatarData, numero, paraNumero, reais, reaisCurto } from '@/lib/format';
import { inicioDoMes, fimDoMes } from '@/server/periodo';
import { FormularioItem, FormularioMovimento } from './Formularios';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Alimentação' };

export default async function Alimentacao() {
  await exigirEquipe();

  const agora = new Date();
  const mes = inicioDoMes(agora);
  const proximo = fimDoMes(agora);
  const trintaDias = new Date(agora.getTime() - 30 * 86_400_000);

  const [itens, movimentos, consumo30, gastoMes, animais] = await Promise.all([
    db.itemEstoque.findMany({ where: { ativo: true }, orderBy: [{ tipo: 'asc' }, { nome: 'asc' }] }),
    db.movimentoEstoque.findMany({
      orderBy: { data: 'desc' },
      take: 40,
      include: { item: true, animal: { select: { id: true, nome: true } } },
    }),
    db.movimentoEstoque.groupBy({
      by: ['itemId'],
      where: { tipo: 'SAIDA', data: { gte: trintaDias } },
      _sum: { quantidade: true },
    }),
    db.despesa.aggregate({
      where: { categoria: 'ALIMENTACAO', data: { gte: mes, lt: proximo } },
      _sum: { valor: true },
    }),
    db.animal.findMany({
      where: { deletadoEm: null, ativo: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true },
    }),
  ]);

  const consumoPorItem = new Map(consumo30.map((c) => [c.itemId, paraNumero(c._sum.quantidade)]));

  const racoes = itens.filter((i) => i.tipo === 'RACAO');
  const saldoRacao = racoes.reduce((s, i) => s + paraNumero(i.saldo), 0);
  const consumoDiario =
    racoes.reduce((s, i) => s + (consumoPorItem.get(i.id) ?? 0), 0) / 30;
  const previsaoDias = consumoDiario > 0 ? Math.floor(saldoRacao / consumoDiario) : null;

  return (
    <>
      <TituloPagina
        titulo="Alimentação e estoque"
        descricao="Quanto tem, quanto sai por dia e quando acaba. O saldo vem dos movimentos, nunca digitado à mão."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          emoji="🍖"
          rotulo="Ração em estoque"
          valor={`${numero(saldoRacao)} kg`}
          destaque
        />
        <Indicador
          emoji="📉"
          rotulo="Consumo médio"
          valor={`${numero(consumoDiario)} kg/dia`}
          detalhe="últimos 30 dias"
        />
        <Indicador
          emoji="📅"
          rotulo="Previsão"
          valor={previsaoDias === null ? '—' : `${previsaoDias} dias`}
          detalhe={previsaoDias !== null && previsaoDias < 15 ? 'reponha logo' : 'no ritmo atual'}
        />
        <Indicador
          emoji="💰"
          rotulo="Gasto com ração no mês"
          valor={reaisCurto(paraNumero(gastoMes._sum.valor))}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px] xl:items-start">
        <div className="space-y-4">
          <FormularioMovimento
            itens={itens.map((i) => ({ id: i.id, nome: i.nome, unidade: i.unidade }))}
            animais={animais}
          />
          <FormularioItem />

          <div>
            <h2 className="titulo-seccao mb-2">Últimos movimentos</h2>
            <Tabela
              cabecalho={['Data', 'Item', 'Movimento', 'Quantidade', 'Valor', 'Destino']}
              vazio={movimentos.length === 0 ? 'Nenhum movimento registrado.' : undefined}
            >
              {movimentos.map((m) => (
                <tr key={m.id} className="transition hover:bg-tinta-fundo/60">
                  <td className="px-4 py-2.5 text-sm tabular-nums text-tinta-suave">
                    {formatarData(m.data)}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-tinta">{m.item.nome}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <span
                      className={`selo ${
                        m.tipo === 'ENTRADA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.tipo === 'PERDA'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-tinta-borda text-tinta-suave'
                      }`}
                    >
                      {m.tipo.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums font-semibold">
                    {numero(m.quantidade)} {m.item.unidade}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-sm">{m.valor ? reais(m.valor) : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-tinta-suave">
                    {m.animal ? (
                      <Link href={`/animais-ong/${m.animal.id}`} className="hover:text-laranja-600">
                        🐾 {m.animal.nome}
                      </Link>
                    ) : (
                      (m.fornecedor ?? 'Abrigo')
                    )}
                  </td>
                </tr>
              ))}
            </Tabela>
          </div>
        </div>

        <Cartao>
          <h2 className="titulo-seccao">Estoque atual</h2>
          {itens.length === 0 ? (
            <div className="mt-3">
              <Vazio emoji="🍖" titulo="Nenhum item cadastrado" />
            </div>
          ) : (
            <ul className="mt-4 space-y-5">
              {itens.map((i) => {
                const saldo = paraNumero(i.saldo);
                const minimo = paraNumero(i.minimo);
                // O teto do medidor é o dobro do mínimo: com o teto no
                // próprio mínimo, qualquer estoque saudável encostaria
                // em 100% e a barra pararia de informar.
                const teto = Math.max(minimo * 2, saldo, 1);
                const baixo = minimo > 0 && saldo <= minimo;
                return (
                  <li key={i.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-petroleo-900">{i.nome}</span>
                      <span className="text-[11px] font-semibold uppercase text-tinta-clara">
                        {TIPO_ITEM[i.tipo]}
                      </span>
                    </div>
                    <Medidor
                      valor={saldo}
                      teto={teto}
                      unidade={i.unidade}
                      cor={baixo ? '#c33a6b' : CORES.entrada}
                    />
                    <p className="mt-1 text-xs text-tinta-suave">
                      {baixo ? (
                        <span className="font-bold text-risco">abaixo do mínimo · reponha</span>
                      ) : (
                        <>
                          mínimo {numero(minimo)} {i.unidade}
                        </>
                      )}
                      {consumoPorItem.get(i.id) ? (
                        <>
                          {' '}
                          · saíram {numero(consumoPorItem.get(i.id))} {i.unidade} em 30 dias
                        </>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Cartao>
      </div>
    </>
  );
}
