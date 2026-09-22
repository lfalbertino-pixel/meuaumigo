import { db } from '@/lib/db';
import { paraNumero } from '@/lib/format';
import { chaveMes, inicioDoMes, fimDoMes, ultimosMeses, somarMeses } from './periodo';

/**
 * Painel da ONG. Uma função só, um `Promise.all` só: a tela abre com 14
 * números e 4 gráficos, e não vale a pena pagar 20 idas ao banco em
 * série por isso.
 */

export type SerieMensal = { mes: Date; rotulo: string; valores: Record<string, number> };

export async function carregarPainel(mesesHistorico = 12) {
  const agora = new Date();
  const mesAtual = inicioDoMes(agora);
  const proximoMes = fimDoMes(agora);
  const inicioHistorico = somarMeses(mesAtual, -(mesesHistorico - 1));

  const [
    animaisAtivos,
    animaisApadrinhados,
    padrinhosAtivos,
    arrecadadoMes,
    despesasMes,
    despesasVetMes,
    contribuicoesHistorico,
    despesasHistorico,
    apadrinhamentosHistorico,
    cancelamentosHistorico,
    inadimplencia,
    semPadrinho,
    estoqueBaixo,
    proximasConsultas,
    campanhasAtivas,
    adocoesEmAndamento,
  ] = await Promise.all([
    db.animal.count({ where: { ativo: true, deletadoEm: null } }),

    db.animal.count({
      where: {
        ativo: true,
        deletadoEm: null,
        apadrinhamentos: { some: { status: 'ATIVO' } },
      },
    }),

    db.padrinho.count({
      where: { deletadoEm: null, apadrinhamentos: { some: { status: 'ATIVO' } } },
    }),

    db.contribuicao.aggregate({
      where: { status: 'PAGA', competencia: { gte: mesAtual, lt: proximoMes } },
      _sum: { valor: true },
    }),

    db.despesa.aggregate({
      where: { data: { gte: mesAtual, lt: proximoMes } },
      _sum: { valor: true },
    }),

    db.despesa.aggregate({
      where: { categoria: 'VETERINARIO', data: { gte: mesAtual, lt: proximoMes } },
      _sum: { valor: true },
    }),

    db.contribuicao.findMany({
      where: { status: 'PAGA', competencia: { gte: inicioHistorico, lt: proximoMes } },
      select: { competencia: true, valor: true },
    }),

    db.despesa.findMany({
      where: { data: { gte: inicioHistorico, lt: proximoMes } },
      select: { data: true, valor: true, categoria: true },
    }),

    db.apadrinhamento.findMany({
      where: { inicio: { gte: inicioHistorico } },
      select: { inicio: true },
    }),

    db.apadrinhamento.findMany({
      where: { status: 'CANCELADO', fim: { gte: inicioHistorico } },
      select: { fim: true },
    }),

    db.contribuicao.aggregate({
      where: { status: { in: ['PENDENTE', 'ATRASADA'] }, competencia: { lt: proximoMes } },
      _sum: { valor: true },
      _count: true,
    }),

    db.animal.count({
      where: {
        ativo: true,
        deletadoEm: null,
        status: { notIn: ['ADOTADO', 'FALECIDO'] },
        apadrinhamentos: { none: { status: 'ATIVO' } },
      },
    }),

    db.$queryRaw<{ id: string; nome: string; saldo: number; minimo: number; unidade: string }[]>`
      SELECT id, nome, saldo::float8 AS saldo, minimo::float8 AS minimo, unidade
      FROM itens_estoque
      WHERE ativo = true AND saldo <= minimo
      ORDER BY (CASE WHEN minimo > 0 THEN saldo / minimo ELSE 0 END) ASC
      LIMIT 6
    `,

    db.registroSaude.findMany({
      where: { proximaData: { gte: agora } },
      orderBy: { proximaData: 'asc' },
      take: 6,
      select: {
        id: true,
        titulo: true,
        tipo: true,
        proximaData: true,
        animal: { select: { id: true, nome: true, slug: true } },
      },
    }),

    db.campanha.findMany({
      where: { status: 'ATIVA' },
      orderBy: [{ urgente: 'desc' }, { criadaEm: 'desc' }],
      take: 4,
      select: {
        id: true,
        slug: true,
        titulo: true,
        meta: true,
        urgente: true,
        prazo: true,
        animal: { select: { nome: true, slug: true } },
        contribuicoes: { where: { status: 'PAGA' }, select: { valor: true } },
      },
    }),

    db.adocao.count({ where: { status: { in: ['INTERESSE', 'ENTREVISTA', 'VISITA', 'APROVADA'] } } }),
  ]);

  const meses = ultimosMeses(mesesHistorico, agora);

  // Agregação em memória: são no máximo ~12 meses de linhas, e fazer isso
  // no banco custaria 4 groupBy a mais por um ganho que ninguém percebe.
  const porMes = <T>(itens: T[], data: (i: T) => Date, valor: (i: T) => number) => {
    const mapa = new Map<string, number>();
    for (const item of itens) {
      const chave = chaveMes(new Date(data(item)));
      mapa.set(chave, (mapa.get(chave) ?? 0) + valor(item));
    }
    return mapa;
  };

  const entradas = porMes(contribuicoesHistorico, (c) => c.competencia, (c) => paraNumero(c.valor));
  const saidas = porMes(despesasHistorico, (d) => d.data, (d) => paraNumero(d.valor));
  const vet = porMes(
    despesasHistorico.filter((d) => d.categoria === 'VETERINARIO'),
    (d) => d.data,
    (d) => paraNumero(d.valor),
  );
  const racao = porMes(
    despesasHistorico.filter((d) => d.categoria === 'ALIMENTACAO'),
    (d) => d.data,
    (d) => paraNumero(d.valor),
  );
  const remedio = porMes(
    despesasHistorico.filter((d) => d.categoria === 'MEDICAMENTO'),
    (d) => d.data,
    (d) => paraNumero(d.valor),
  );
  const novos = porMes(apadrinhamentosHistorico, (a) => a.inicio, () => 1);
  const cancelados = porMes(cancelamentosHistorico, (a) => a.fim!, () => 1);

  const serie = (mapas: Record<string, Map<string, number>>): SerieMensal[] =>
    meses.map((mes) => ({
      mes,
      rotulo: mes.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      valores: Object.fromEntries(
        Object.entries(mapas).map(([chave, mapa]) => [chave, mapa.get(chaveMes(mes)) ?? 0]),
      ),
    }));

  const despesasPorCategoria = await db.despesa.groupBy({
    by: ['categoria'],
    where: { data: { gte: mesAtual, lt: proximoMes } },
    _sum: { valor: true },
  });

  return {
    mesAtual,
    cartoes: {
      animaisAtivos,
      animaisApadrinhados,
      padrinhosAtivos,
      arrecadadoMes: paraNumero(arrecadadoMes._sum.valor),
      despesasMes: paraNumero(despesasMes._sum.valor),
      despesasVetMes: paraNumero(despesasVetMes._sum.valor),
      semPadrinho,
      inadimplenciaValor: paraNumero(inadimplencia._sum.valor),
      inadimplenciaCount: inadimplencia._count,
      adocoesEmAndamento,
    },
    fluxo: serie({ entrada: entradas, saida: saidas }),
    custeio: serie({ veterinario: vet, alimentacao: racao, medicamento: remedio }),
    padrinhos: serie({ novos, cancelados }),
    despesasPorCategoria: despesasPorCategoria
      .map((d) => ({ categoria: d.categoria as string, valor: paraNumero(d._sum.valor) }))
      .filter((d) => d.valor > 0)
      .sort((a, b) => b.valor - a.valor),
    estoqueBaixo,
    proximasConsultas,
    campanhas: campanhasAtivas.map((c) => ({
      id: c.id,
      slug: c.slug,
      titulo: c.titulo,
      urgente: c.urgente,
      prazo: c.prazo,
      animal: c.animal,
      meta: paraNumero(c.meta),
      arrecadado: c.contribuicoes.reduce((s, x) => s + paraNumero(x.valor), 0),
    })),
  };
}

/**
 * Os números que a ONG leva para empresa e parceiro. Acumulado desde
 * sempre, não do mês: é história, não gestão.
 */
export async function carregarImpacto() {
  const [
    resgatados,
    apadrinhados,
    adotados,
    tratamentos,
    vacinas,
    castracoes,
    racaoKg,
    totalDestinado,
    padrinhos,
  ] = await Promise.all([
    db.animal.count({ where: { deletadoEm: null } }),
    db.animal.count({ where: { deletadoEm: null, apadrinhamentos: { some: {} } } }),
    db.animal.count({ where: { deletadoEm: null, status: 'ADOTADO' } }),
    db.registroSaude.count({ where: { tipo: { in: ['CONSULTA', 'CIRURGIA', 'EXAME', 'MEDICAMENTO'] } } }),
    db.registroSaude.count({ where: { tipo: 'VACINA' } }),
    db.registroSaude.count({ where: { tipo: 'CASTRACAO' } }),
    db.movimentoEstoque.aggregate({
      where: { tipo: 'SAIDA', item: { tipo: 'RACAO' } },
      _sum: { quantidade: true },
    }),
    db.despesa.aggregate({ _sum: { valor: true } }),
    db.padrinho.count({ where: { deletadoEm: null } }),
  ]);

  return {
    resgatados,
    apadrinhados,
    adotados,
    tratamentos,
    vacinas,
    castracoes,
    racaoKg: paraNumero(racaoKg._sum.quantidade),
    totalDestinado: paraNumero(totalDestinado._sum.valor),
    padrinhos,
  };
}
