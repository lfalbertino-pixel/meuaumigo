import { db } from '@/lib/db';
import { paraNumero } from '@/lib/format';
import { chaveMes, inicioDoMes, somarMeses, ultimosMeses } from './periodo';
import { calcularCusto, selecaoCusto } from './custos';

/**
 * Os números que a ONG leva para reunião. Todos olham para trás e
 * respondem a uma pergunta específica — relatório que não responde
 * pergunta ninguém abre duas vezes.
 */
export async function carregarRelatorios(meses = 12) {
  const agora = new Date();
  const inicio = somarMeses(inicioDoMes(agora), -(meses - 1));
  const fim = somarMeses(inicioDoMes(agora), 1);

  const [animais, modalidades, inicios, fins, contribuicoes, despesasAnimal, adocoes] =
    await Promise.all([
      db.animal.findMany({
        where: { deletadoEm: null, ativo: true },
        select: { id: true, nome: true, status: true, dataResgate: true, ...selecaoCusto },
      }),

      db.apadrinhamento.groupBy({
        by: ['modalidade'],
        where: { status: 'ATIVO' },
        _sum: { valorMensal: true },
        _count: true,
      }),

      db.apadrinhamento.findMany({
        where: { inicio: { gte: inicio } },
        select: { inicio: true },
      }),

      db.apadrinhamento.findMany({
        where: { status: 'CANCELADO', fim: { gte: inicio } },
        select: { fim: true },
      }),

      db.contribuicao.findMany({
        where: { competencia: { gte: inicio, lt: fim } },
        select: { competencia: true, valor: true, status: true, origem: true },
      }),

      db.despesa.groupBy({
        by: ['animalId'],
        where: { data: { gte: inicio, lt: fim }, animalId: { not: null } },
        _sum: { valor: true },
        orderBy: { _sum: { valor: 'desc' } },
        take: 12,
      }),

      db.adocao.groupBy({ by: ['status'], _count: true }),
    ]);

  const nomes = new Map(animais.map((a) => [a.id, a.nome]));

  // Retenção: entradas e saídas por mês. O saldo acumulado é o que
  // realmente diz se a base cresce — dois meses seguidos negativos é o
  // sinal de que a comunicação com os padrinhos parou.
  const mapaInicios = new Map<string, number>();
  for (const i of inicios) {
    const k = chaveMes(new Date(i.inicio));
    mapaInicios.set(k, (mapaInicios.get(k) ?? 0) + 1);
  }
  const mapaFins = new Map<string, number>();
  for (const f of fins) {
    if (!f.fim) continue;
    const k = chaveMes(new Date(f.fim));
    mapaFins.set(k, (mapaFins.get(k) ?? 0) + 1);
  }

  const retencao = ultimosMeses(meses, agora).map((mes) => {
    const k = chaveMes(mes);
    const novos = mapaInicios.get(k) ?? 0;
    const cancelados = mapaFins.get(k) ?? 0;
    return {
      rotulo: mes.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      valores: { novos, cancelados, saldo: novos - cancelados },
    };
  });

  // Cobrança: quanto foi lançado x quanto foi efetivamente pago.
  const mapaLancado = new Map<string, number>();
  const mapaPago = new Map<string, number>();
  for (const c of contribuicoes) {
    const k = chaveMes(new Date(c.competencia));
    const v = paraNumero(c.valor);
    if (c.status !== 'CANCELADA') mapaLancado.set(k, (mapaLancado.get(k) ?? 0) + v);
    if (c.status === 'PAGA') mapaPago.set(k, (mapaPago.get(k) ?? 0) + v);
  }

  const cobranca = ultimosMeses(meses, agora).map((mes) => {
    const k = chaveMes(mes);
    return {
      rotulo: mes.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      valores: { lancado: mapaLancado.get(k) ?? 0, pago: mapaPago.get(k) ?? 0 },
    };
  });

  const totalLancado = [...mapaLancado.values()].reduce((s, v) => s + v, 0);
  const totalPago = [...mapaPago.values()].reduce((s, v) => s + v, 0);

  const comCusto = animais.map((a) => ({
    id: a.id,
    nome: a.nome,
    status: a.status,
    dataResgate: a.dataResgate,
    ...calcularCusto(a),
  }));

  return {
    retencao,
    cobranca,
    totalLancado,
    totalPago,
    // Inadimplência sobre o que foi cobrado, não sobre a receita ideal:
    // é o número que a equipe consegue agir em cima.
    taxaInadimplencia: totalLancado > 0 ? ((totalLancado - totalPago) / totalLancado) * 100 : 0,
    modalidades: modalidades.map((m) => ({
      modalidade: m.modalidade as string,
      quantidade: m._count,
      valor: paraNumero(m._sum.valorMensal),
    })),
    descobertos: comCusto
      .filter((a) => a.falta > 0)
      .sort((a, b) => b.falta - a.falta)
      .slice(0, 15),
    maioresCustos: despesasAnimal.map((d) => ({
      id: d.animalId!,
      nome: nomes.get(d.animalId!) ?? '—',
      valor: paraNumero(d._sum.valor),
    })),
    metaMensalTotal: comCusto.reduce((s, a) => s + a.total, 0),
    apoioMensalTotal: comCusto.reduce((s, a) => s + a.apoiado, 0),
    adocoes: Object.fromEntries(adocoes.map((a) => [a.status, a._count])),
  };
}
