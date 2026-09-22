import { db } from '@/lib/db';
import { mesesEntre, paraNumero } from '@/lib/format';
import { calcularCusto, ratearContribuicao, selecaoCusto } from './custos';
import { calcularConquistas, type DadosConquista } from './gamificacao';
import { inicioDoMes } from './periodo';

/**
 * A área do padrinho.
 *
 * O coração do produto não é "quanto você pagou" — é "o que o seu
 * dinheiro fez pelo Thor". Tudo aqui é montado em torno de um animal
 * específico, com nome, foto e a última notícia dele.
 */

export async function carregarMeusAumigos(padrinhoId: string) {
  const [padrinho, notificacoes] = await Promise.all([
    db.padrinho.findUnique({
      where: { id: padrinhoId },
      include: {
        apadrinhamentos: {
          orderBy: [{ status: 'asc' }, { inicio: 'asc' }],
          include: {
            animal: {
              select: {
                id: true,
                slug: true,
                nome: true,
                especie: true,
                status: true,
                fotoCapaId: true,
                dataNascimento: true,
                idadeAproximada: true,
                porte: true,
                ...selecaoCusto,
                atualizacoes: { orderBy: { criadaEm: 'desc' }, take: 1 },
                registrosSaude: {
                  where: { proximaData: { gte: new Date() } },
                  orderBy: { proximaData: 'asc' },
                  take: 1,
                  select: { proximaData: true, titulo: true, tipo: true },
                },
              },
            },
          },
        },
        contribuicoes: { orderBy: { competencia: 'desc' }, take: 36 },
      },
    }),
    db.notificacao.findMany({
      where: { padrinhoId },
      orderBy: { criadaEm: 'desc' },
      take: 20,
      include: { animal: { select: { nome: true, slug: true } } },
    }),
  ]);

  if (!padrinho) return null;

  const ativos = padrinho.apadrinhamentos.filter((a) => a.status === 'ATIVO');
  const mensal = ativos.reduce((s, a) => s + paraNumero(a.valorMensal), 0);
  const totalPago = padrinho.contribuicoes
    .filter((c) => c.status === 'PAGA')
    .reduce((s, c) => s + paraNumero(c.valor), 0);

  const maisAntigo = padrinho.apadrinhamentos.reduce<Date | null>(
    (mais, a) => (!mais || a.inicio < mais ? a.inicio : mais),
    null,
  );

  const dados: DadosConquista = {
    mesesMaisAntigo: maisAntigo ? mesesEntre(maisAntigo, new Date()) : 0,
    animaisApoiados: new Set(padrinho.apadrinhamentos.map((a) => a.animal.id)).size,
    animaisAtivos: ativos.length,
    mesesPagos: padrinho.contribuicoes.filter((c) => c.status === 'PAGA').length,
    apoiouCampanha: padrinho.contribuicoes.some((c) => c.origem === 'CAMPANHA'),
  };

  return {
    padrinho,
    apadrinhamentos: padrinho.apadrinhamentos.map((a) => ({
      ...a,
      valorMensal: paraNumero(a.valorMensal),
      custo: calcularCusto(a.animal),
      ultimaAtualizacao: a.animal.atualizacoes[0] ?? null,
      proximaConsulta: a.animal.registrosSaude[0] ?? null,
      mesesDeAmizade: mesesEntre(a.inicio, new Date()),
    })),
    ativos: ativos.length,
    mensal,
    totalPago,
    emAberto: padrinho.contribuicoes.filter((c) => c.status === 'PENDENTE' || c.status === 'ATRASADA'),
    conquistas: calcularConquistas(dados),
    naoLidas: notificacoes.filter((n) => !n.lidaEm).length,
    notificacoes,
  };
}

/** A página de um AUmigo específico, do ponto de vista de quem o apadrinha. */
export async function carregarMeuAumigo(padrinhoId: string, slug: string) {
  const apadrinhamento = await db.apadrinhamento.findFirst({
    where: { padrinhoId, animal: { slug } },
    orderBy: { inicio: 'desc' },
    include: {
      animal: {
        include: {
          atualizacoes: { orderBy: { criadaEm: 'desc' }, take: 10, include: { foto: true } },
          eventosDiario: { where: { interno: false }, orderBy: { data: 'desc' }, take: 20 },
          registrosSaude: {
            where: { proximaData: { gte: new Date() } },
            orderBy: { proximaData: 'asc' },
            take: 3,
          },
          fotos: { orderBy: { criadaEm: 'desc' }, take: 8 },
          apadrinhamentos: { where: { status: 'ATIVO' }, select: { valorMensal: true, status: true } },
        },
      },
    },
  });

  if (!apadrinhamento) return null;

  const competencia = inicioDoMes();

  const [contribuicaoDoMes, historico] = await Promise.all([
    db.contribuicao.findFirst({
      where: { apadrinhamentoId: apadrinhamento.id, competencia },
    }),
    db.contribuicao.findMany({
      where: { apadrinhamentoId: apadrinhamento.id },
      orderBy: { competencia: 'desc' },
      take: 12,
    }),
  ]);

  // O rateio usa o que a pessoa efetivamente pagou no mês. Se o mês ainda
  // não foi pago, mostramos a distribuição do valor mensal como previsão,
  // e a tela diz que é previsão.
  const valorParaRatear = paraNumero(contribuicaoDoMes?.valor ?? apadrinhamento.valorMensal);
  const destino = await ratearContribuicao(apadrinhamento.animalId, valorParaRatear, competencia);

  return {
    apadrinhamento: { ...apadrinhamento, valorMensal: paraNumero(apadrinhamento.valorMensal) },
    animal: apadrinhamento.animal,
    custo: calcularCusto(apadrinhamento.animal),
    mesesDeAmizade: mesesEntre(apadrinhamento.inicio, new Date()),
    contribuicaoDoMes,
    pagouOMes: contribuicaoDoMes?.status === 'PAGA',
    destino,
    valorParaRatear,
    historico,
  };
}

export async function marcarNotificacoesLidas(padrinhoId: string): Promise<void> {
  await db.notificacao.updateMany({
    where: { padrinhoId, lidaEm: null },
    data: { lidaEm: new Date() },
  });
}
