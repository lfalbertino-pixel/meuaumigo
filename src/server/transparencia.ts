import { db } from '@/lib/db';
import { paraNumero } from '@/lib/format';
import { chaveMes, inicioDoMes, somarMeses, ultimosMeses } from './periodo';

/**
 * A prestação de contas pública.
 *
 * Só sai daqui o que a ONG marcou como público. A regra é mostrar o
 * DESTINO do dinheiro — quanto entrou, em que foi gasto, com que
 * comprovante — sem abrir a contabilidade interna (salário, aluguel,
 * fornecedor com preço negociado). Transparência não é o mesmo que
 * expor tudo, e confundir as duas coisas é o jeito mais rápido de uma
 * ONG parar de publicar qualquer coisa.
 */
export async function carregarTransparencia(meses = 12) {
  const agora = new Date();
  const inicio = somarMeses(inicioDoMes(agora), -(meses - 1));
  const fim = somarMeses(inicioDoMes(agora), 1);

  const [entradas, saidas, porCategoria, comprovantes] = await Promise.all([
    db.contribuicao.findMany({
      where: { status: 'PAGA', competencia: { gte: inicio, lt: fim } },
      select: { competencia: true, valor: true },
    }),
    db.despesa.findMany({
      where: { data: { gte: inicio, lt: fim } },
      select: { data: true, valor: true },
    }),
    db.despesa.groupBy({
      by: ['categoria'],
      where: { data: { gte: inicio, lt: fim } },
      _sum: { valor: true },
    }),
    db.comprovante.findMany({
      where: { publico: true },
      orderBy: { criadoEm: 'desc' },
      take: 12,
      select: {
        id: true,
        titulo: true,
        tipo: true,
        criadoEm: true,
        despesa: {
          select: {
            valor: true,
            data: true,
            categoria: true,
            fornecedor: true,
            animal: { select: { nome: true, slug: true } },
          },
        },
      },
    }),
  ]);

  const acumular = <T>(itens: T[], data: (i: T) => Date, valor: (i: T) => number) => {
    const mapa = new Map<string, number>();
    for (const item of itens) {
      const chave = chaveMes(new Date(data(item)));
      mapa.set(chave, (mapa.get(chave) ?? 0) + valor(item));
    }
    return mapa;
  };

  const mapaEntradas = acumular(entradas, (e) => e.competencia, (e) => paraNumero(e.valor));
  const mapaSaidas = acumular(saidas, (s) => s.data, (s) => paraNumero(s.valor));

  const serie = ultimosMeses(meses, agora).map((mes) => ({
    rotulo: mes.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    valores: {
      entrada: mapaEntradas.get(chaveMes(mes)) ?? 0,
      saida: mapaSaidas.get(chaveMes(mes)) ?? 0,
    },
  }));

  return {
    serie,
    totalEntrada: [...mapaEntradas.values()].reduce((s, v) => s + v, 0),
    totalSaida: [...mapaSaidas.values()].reduce((s, v) => s + v, 0),
    porCategoria: porCategoria
      .map((c) => ({ categoria: c.categoria as string, valor: paraNumero(c._sum.valor) }))
      .filter((c) => c.valor > 0)
      .sort((a, b) => b.valor - a.valor),
    comprovantes,
  };
}
