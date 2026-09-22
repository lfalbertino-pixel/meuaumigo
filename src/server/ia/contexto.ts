import { db } from '@/lib/db';
import { paraNumero, reais } from '@/lib/format';
import { inicioDoMes, fimDoMes } from '@/server/periodo';
import { calcularCusto, selecaoCusto } from '@/server/custos';

/**
 * O contexto que vai junto com a pergunta.
 *
 * A IA NÃO consulta o banco por conta própria e não recebe ferramenta de
 * leitura: o que ela vê é este resumo, montado aqui, com limite de
 * tamanho conhecido. Duas razões — custo previsível, e nenhum dado
 * pessoal de padrinho sai daqui. Nome e e-mail de quem doa não são
 * assunto de modelo de terceiro; agregados, sim.
 */
export async function montarContexto(): Promise<string> {
  const mes = inicioDoMes();
  const proximo = fimDoMes();

  const [animais, entradas, despesasCat, porAnimal, campanhas, estoque, semPadrinho, atrasadas] =
    await Promise.all([
      db.animal.findMany({
        where: { ativo: true, deletadoEm: null },
        orderBy: { dataResgate: 'desc' },
        select: {
          nome: true,
          slug: true,
          status: true,
          especie: true,
          porte: true,
          dataResgate: true,
          necessidadeEspecial: true,
          ...selecaoCusto,
        },
      }),
      db.contribuicao.aggregate({
        where: { status: 'PAGA', competencia: { gte: mes, lt: proximo } },
        _sum: { valor: true },
        _count: true,
      }),
      db.despesa.groupBy({
        by: ['categoria'],
        where: { data: { gte: mes, lt: proximo } },
        _sum: { valor: true },
      }),
      db.despesa.groupBy({
        by: ['animalId'],
        where: { data: { gte: mes, lt: proximo }, animalId: { not: null } },
        _sum: { valor: true },
        orderBy: { _sum: { valor: 'desc' } },
        take: 10,
      }),
      db.campanha.findMany({
        where: { status: 'ATIVA' },
        select: {
          titulo: true,
          meta: true,
          contribuicoes: { where: { status: 'PAGA' }, select: { valor: true } },
        },
      }),
      db.itemEstoque.findMany({
        where: { ativo: true },
        select: { nome: true, saldo: true, minimo: true, unidade: true },
      }),
      db.animal.count({
        where: {
          ativo: true,
          deletadoEm: null,
          status: { notIn: ['ADOTADO', 'FALECIDO'] },
          apadrinhamentos: { none: { status: 'ATIVO' } },
        },
      }),
      db.contribuicao.aggregate({
        where: { status: { in: ['PENDENTE', 'ATRASADA'] } },
        _sum: { valor: true },
        _count: true,
      }),
    ]);

  const nomes = new Map(
    (
      await db.animal.findMany({
        where: { id: { in: porAnimal.map((p) => p.animalId!).filter(Boolean) } },
        select: { id: true, nome: true },
      })
    ).map((a) => [a.id, a.nome]),
  );

  const linhaAnimal = (a: (typeof animais)[number]) => {
    const custo = calcularCusto(a);
    return `- ${a.nome} (/${a.slug}): ${a.status}, ${a.especie}, porte ${a.porte}${
      a.necessidadeEspecial ? ', necessidade especial' : ''
    }, resgatado em ${a.dataResgate.toLocaleDateString('pt-BR')}. Custo ${reais(custo.total)}/mês, apoiado ${reais(custo.apoiado)} por ${custo.padrinhos} padrinho(s), falta ${reais(custo.falta)}.`;
  };

  const totalDespesas = despesasCat.reduce((s, d) => s + paraNumero(d._sum.valor), 0);

  return [
    `DATA DE HOJE: ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    `## Animais ativos (${animais.length})`,
    ...animais.slice(0, 120).map(linhaAnimal),
    animais.length > 120 ? `(+${animais.length - 120} animais não listados)` : '',
    '',
    '## Financeiro do mês corrente',
    `Arrecadado (confirmado): ${reais(paraNumero(entradas._sum.valor))} em ${entradas._count} lançamentos.`,
    `Despesas do mês: ${reais(totalDespesas)}.`,
    ...despesasCat.map((d) => `- ${d.categoria}: ${reais(paraNumero(d._sum.valor))}`),
    `Em aberto (pendente + atrasado): ${reais(paraNumero(atrasadas._sum.valor))} em ${atrasadas._count} lançamentos.`,
    `Animais ativos sem nenhum padrinho: ${semPadrinho}.`,
    '',
    '## Maiores despesas por animal no mês',
    ...porAnimal.map(
      (p) => `- ${nomes.get(p.animalId!) ?? '—'}: ${reais(paraNumero(p._sum.valor))}`,
    ),
    '',
    '## Campanhas ativas',
    ...campanhas.map((c) => {
      const arrecadado = c.contribuicoes.reduce((s, x) => s + paraNumero(x.valor), 0);
      return `- ${c.titulo}: ${reais(arrecadado)} de ${reais(paraNumero(c.meta))}.`;
    }),
    campanhas.length === 0 ? '(nenhuma)' : '',
    '',
    '## Estoque',
    ...estoque.map(
      (i) =>
        `- ${i.nome}: ${paraNumero(i.saldo)} ${i.unidade} (mínimo ${paraNumero(i.minimo)} ${i.unidade})${
          paraNumero(i.saldo) <= paraNumero(i.minimo) ? ' ⚠️ ABAIXO DO MÍNIMO' : ''
        }`,
    ),
    estoque.length === 0 ? '(nenhum item cadastrado)' : '',
  ]
    .filter(Boolean)
    .join('\n');
}
