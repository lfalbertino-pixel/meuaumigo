import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { paraNumero } from '@/lib/format';

/**
 * O número que sustenta a vitrine pública: quanto custa manter este
 * animal por mês, quanto disso já está coberto por padrinho, e quanto
 * falta. É o "❤️ 70% apoiado" do cartão.
 *
 * Custo é a ESTIMATIVA da ONG (campos do próprio animal), não o gasto
 * real do mês. Isso é proposital: o apadrinhamento é recorrente e
 * precisa de um alvo estável. Um mês com cirurgia não pode fazer a meta
 * do Thor saltar de R$ 500 para R$ 3.000 na página pública — para isso
 * existe campanha de emergência.
 */

export type CustoAnimal = {
  alimentacao: number;
  tratamento: number;
  medicamento: number;
  total: number;
  apoiado: number;
  falta: number;
  /** 0–100, travado no teto: apoio acima da meta não vira 140%. */
  percentual: number;
  padrinhos: number;
};

type AnimalComCusto = {
  custoAlimentacao: Prisma.Decimal | number;
  custoTratamento: Prisma.Decimal | number;
  custoMedicamento: Prisma.Decimal | number;
  apadrinhamentos?: { valorMensal: Prisma.Decimal | number; status: string }[];
};

export function calcularCusto(animal: AnimalComCusto): CustoAnimal {
  const alimentacao = paraNumero(animal.custoAlimentacao);
  const tratamento = paraNumero(animal.custoTratamento);
  const medicamento = paraNumero(animal.custoMedicamento);
  const total = alimentacao + tratamento + medicamento;

  const ativos = (animal.apadrinhamentos ?? []).filter((a) => a.status === 'ATIVO');
  const apoiado = ativos.reduce((soma, a) => soma + paraNumero(a.valorMensal), 0);

  return {
    alimentacao,
    tratamento,
    medicamento,
    total,
    apoiado,
    falta: Math.max(0, total - apoiado),
    percentual: total > 0 ? Math.min(100, (apoiado / total) * 100) : apoiado > 0 ? 100 : 0,
    padrinhos: ativos.length,
  };
}

/** O `select` mínimo para que `calcularCusto` funcione. */
export const selecaoCusto = {
  custoAlimentacao: true,
  custoTratamento: true,
  custoMedicamento: true,
  apadrinhamentos: {
    where: { status: 'ATIVO' as const },
    select: { valorMensal: true, status: true },
  },
} satisfies Prisma.AnimalSelect;

/**
 * Onde o dinheiro DESTE padrinho foi parar neste mês.
 *
 * O rateio segue a despesa real do animal no mês, por categoria. Quando
 * o animal não teve despesa lançada no mês — acontece, e é normal —, cai
 * para a proporção do custo estimado. Nos dois casos o total distribuído
 * é exatamente o que a pessoa pagou: ela nunca vê uma soma diferente da
 * que saiu da conta dela.
 */
export async function ratearContribuicao(
  animalId: string,
  valorPago: number,
  competencia: Date,
): Promise<{ categoria: string; rotulo: string; valor: number }[]> {
  const fim = new Date(competencia.getFullYear(), competencia.getMonth() + 1, 1);

  const despesas = await db.despesa.groupBy({
    by: ['categoria'],
    where: { animalId, data: { gte: competencia, lt: fim } },
    _sum: { valor: true },
  });

  let pesos = despesas.map((d) => ({
    categoria: d.categoria as string,
    peso: paraNumero(d._sum.valor),
  }));
  let totalPesos = pesos.reduce((s, p) => s + p.peso, 0);

  if (totalPesos <= 0) {
    const animal = await db.animal.findUnique({
      where: { id: animalId },
      select: { custoAlimentacao: true, custoTratamento: true, custoMedicamento: true },
    });
    pesos = [
      { categoria: 'ALIMENTACAO', peso: paraNumero(animal?.custoAlimentacao) },
      { categoria: 'VETERINARIO', peso: paraNumero(animal?.custoTratamento) },
      { categoria: 'MEDICAMENTO', peso: paraNumero(animal?.custoMedicamento) },
    ];
    totalPesos = pesos.reduce((s, p) => s + p.peso, 0);
  }

  if (totalPesos <= 0) return [];

  const rotulos: Record<string, string> = {
    VETERINARIO: 'Veterinário',
    ALIMENTACAO: 'Alimentação',
    MEDICAMENTO: 'Medicamentos',
    HIGIENE: 'Higiene',
    TRANSPORTE: 'Transporte',
    ESTRUTURA: 'Estrutura',
    OUTRO: 'Outros',
  };

  const linhas = pesos
    .filter((p) => p.peso > 0)
    .map((p) => ({
      categoria: p.categoria,
      rotulo: rotulos[p.categoria] ?? p.categoria,
      valor: Math.round((valorPago * p.peso * 100) / totalPesos) / 100,
    }))
    .sort((a, b) => b.valor - a.valor);

  // O arredondamento de centavos sobra ou falta uns trocados; joga a
  // diferença na maior linha para que a soma bata com o que foi pago.
  const somado = linhas.reduce((s, l) => s + l.valor, 0);
  const resto = Math.round((valorPago - somado) * 100) / 100;
  if (linhas.length > 0 && resto !== 0) linhas[0].valor = Math.round((linhas[0].valor + resto) * 100) / 100;

  return linhas;
}
