'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, exigirAdmin, exigirEquipe, registrarAuditoria } from '@/lib/auth';
import { guardar, mimeDeComprovante } from '@/lib/storage';
import { inicioDoMes } from '@/server/periodo';

export type EstadoFinanceiro = { erro?: string; ok?: string };

// ----------------------------------------------------------
// Entradas
// ----------------------------------------------------------

export async function confirmarPagamento(
  _anterior: EstadoFinanceiro,
  dados: FormData,
): Promise<EstadoFinanceiro> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    id: z.string().min(1),
    metodo: z.enum(['PIX', 'CARTAO', 'BOLETO', 'TRANSFERENCIA', 'DINHEIRO', 'OUTRO']).default('PIX'),
    referencia: z.string().trim().max(120).optional(),
  });

  const bruto = esquema.safeParse({
    id: dados.get('id'),
    metodo: dados.get('metodo') || 'PIX',
    referencia: dados.get('referencia') || undefined,
  });
  if (!bruto.success) return { erro: 'Dados inválidos.' };

  const contribuicao = await db.contribuicao.findUnique({
    where: { id: bruto.data.id },
    select: { status: true, valor: true, padrinhoId: true, animalId: true },
  });
  if (!contribuicao) return { erro: 'Lançamento não encontrado.' };
  if (contribuicao.status === 'PAGA') return { erro: 'Este lançamento já está marcado como pago.' };

  await db.contribuicao.update({
    where: { id: bruto.data.id },
    data: {
      status: 'PAGA',
      metodo: bruto.data.metodo,
      referencia: bruto.data.referencia,
      pagoEm: new Date(),
    },
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'contribuicao.confirmada',
    entidade: 'Contribuicao',
    entidadeId: bruto.data.id,
    detalhe: { valor: Number(contribuicao.valor), metodo: bruto.data.metodo },
  });

  revalidatePath('/financeiro');
  revalidatePath('/painel');
  return { ok: 'Pagamento confirmado.' };
}

/**
 * Gera as mensalidades do mês corrente para todo apadrinhamento ATIVO.
 *
 * Idempotente: quem já tem lançamento no mês é pulado. Isso importa
 * porque a ação é um botão, e um botão é clicado duas vezes — nesta
 * VPS não há agendador, então quem dispara a cobrança é a equipe.
 */
export async function gerarMensalidades(): Promise<EstadoFinanceiro> {
  await conferirMesmaOrigem();
  const usuario = await exigirAdmin();

  const competencia = inicioDoMes();
  const proximo = new Date(competencia.getFullYear(), competencia.getMonth() + 1, 1);

  const ativos = await db.apadrinhamento.findMany({
    where: { status: 'ATIVO' },
    select: { id: true, padrinhoId: true, animalId: true, valorMensal: true, diaVencimento: true },
  });

  const jaLancados = new Set(
    (
      await db.contribuicao.findMany({
        where: {
          origem: 'APADRINHAMENTO',
          competencia: { gte: competencia, lt: proximo },
          apadrinhamentoId: { in: ativos.map((a) => a.id) },
        },
        select: { apadrinhamentoId: true },
      })
    ).map((c) => c.apadrinhamentoId),
  );

  const novos = ativos.filter((a) => !jaLancados.has(a.id));
  if (novos.length === 0) return { ok: 'As mensalidades deste mês já estavam geradas.' };

  await db.contribuicao.createMany({
    data: novos.map((a) => ({
      origem: 'APADRINHAMENTO' as const,
      apadrinhamentoId: a.id,
      padrinhoId: a.padrinhoId,
      animalId: a.animalId,
      valor: a.valorMensal,
      status: 'PENDENTE' as const,
      competencia,
      vencimento: new Date(competencia.getFullYear(), competencia.getMonth(), a.diaVencimento),
    })),
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'financeiro.mensalidades_geradas',
    entidade: 'Contribuicao',
    detalhe: { competencia: competencia.toISOString(), quantidade: novos.length },
  });

  revalidatePath('/financeiro');
  return { ok: `${novos.length} mensalidades geradas.` };
}

/** Pendente que passou do vencimento vira ATRASADA — o painel conta as duas. */
export async function marcarAtrasadas(): Promise<EstadoFinanceiro> {
  await conferirMesmaOrigem();
  const usuario = await exigirAdmin();

  const resultado = await db.contribuicao.updateMany({
    where: { status: 'PENDENTE', vencimento: { lt: new Date() } },
    data: { status: 'ATRASADA' },
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'financeiro.marcou_atrasadas',
    entidade: 'Contribuicao',
    detalhe: { quantidade: resultado.count },
  });

  revalidatePath('/financeiro');
  return { ok: `${resultado.count} lançamentos marcados como atrasados.` };
}

// ----------------------------------------------------------
// Saídas
// ----------------------------------------------------------

export async function lancarDespesa(
  _anterior: EstadoFinanceiro,
  dados: FormData,
): Promise<EstadoFinanceiro> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    categoria: z.enum([
      'VETERINARIO',
      'ALIMENTACAO',
      'MEDICAMENTO',
      'HIGIENE',
      'TRANSPORTE',
      'ESTRUTURA',
      'OUTRO',
    ]),
    animalId: z.string().optional(),
    descricao: z.string().trim().min(3, 'Descreva a despesa.').max(200),
    valor: z.coerce.number().min(0.01, 'Informe o valor.').max(1_000_000),
    data: z.string().min(1, 'Informe a data.'),
    fornecedor: z.string().trim().max(120).optional(),
  });

  const bruto = esquema.safeParse({
    categoria: dados.get('categoria'),
    animalId: dados.get('animalId') || undefined,
    descricao: dados.get('descricao'),
    valor: dados.get('valor'),
    data: dados.get('data'),
    fornecedor: dados.get('fornecedor') || undefined,
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };
  const e = bruto.data;

  const despesa = await db.despesa.create({
    data: {
      categoria: e.categoria,
      animalId: e.animalId || null,
      descricao: e.descricao,
      valor: e.valor,
      data: new Date(e.data),
      fornecedor: e.fornecedor,
    },
  });

  // O comprovante é opcional, mas quando vem já nasce colado na despesa:
  // é isso que a página pública de transparência publica.
  const arquivo = dados.get('comprovante');
  if (arquivo instanceof File && arquivo.size > 0) {
    if (!mimeDeComprovante(arquivo.type)) {
      return { erro: 'Despesa lançada, mas o comprovante precisa ser PDF ou imagem.' };
    }
    const { arquivo: nome, bytes } = await guardar(
      'comprovantes',
      Buffer.from(await arquivo.arrayBuffer()),
      arquivo.type,
    );
    await db.comprovante.create({
      data: {
        despesaId: despesa.id,
        tipo: (dados.get('tipoComprovante') as 'NOTA_FISCAL' | 'RECIBO' | 'CUPOM' | 'CONTRATO' | 'OUTRO') ?? 'RECIBO',
        titulo: String(dados.get('tituloComprovante') || e.descricao).slice(0, 140),
        arquivo: nome,
        mimeType: arquivo.type,
        bytes,
        publico: dados.get('publicoComprovante') === 'on',
      },
    });
  }

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'despesa.lancada',
    entidade: 'Despesa',
    entidadeId: despesa.id,
    detalhe: { categoria: e.categoria, valor: e.valor },
  });

  revalidatePath('/financeiro');
  revalidatePath('/painel');
  if (e.animalId) revalidatePath(`/animais-ong/${e.animalId}`);
  return { ok: 'Despesa lançada.' };
}
