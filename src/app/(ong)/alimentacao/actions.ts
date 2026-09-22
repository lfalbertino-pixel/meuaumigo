'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, exigirEquipe, registrarAuditoria } from '@/lib/auth';

export type EstadoEstoque = { erro?: string; ok?: string };

export async function criarItem(_anterior: EstadoEstoque, dados: FormData): Promise<EstadoEstoque> {
  await conferirMesmaOrigem();
  await exigirEquipe();

  const esquema = z.object({
    nome: z.string().trim().min(2, 'Informe o nome do item.').max(80),
    tipo: z.enum(['RACAO', 'MEDICAMENTO', 'HIGIENE', 'OUTRO']),
    unidade: z.string().trim().min(1).max(10),
    minimo: z.coerce.number().min(0).max(100_000),
  });

  const bruto = esquema.safeParse({
    nome: dados.get('nome'),
    tipo: dados.get('tipo'),
    unidade: dados.get('unidade') || 'kg',
    minimo: dados.get('minimo') || 0,
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };

  await db.itemEstoque.create({ data: bruto.data });
  revalidatePath('/alimentacao');
  return { ok: 'Item criado.' };
}

/**
 * Movimento de estoque. O saldo NÃO é digitado: ele é consequência dos
 * movimentos, dentro da mesma transação. Deixar alguém corrigir o saldo
 * à mão é como um estoque para de bater com a realidade em duas semanas.
 *
 * Entrada com valor também vira despesa de alimentação — a compra de
 * ração precisa aparecer no financeiro sem ninguém lançar duas vezes.
 */
export async function movimentar(_anterior: EstadoEstoque, dados: FormData): Promise<EstadoEstoque> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    itemId: z.string().min(1),
    tipo: z.enum(['ENTRADA', 'SAIDA', 'PERDA', 'AJUSTE']),
    quantidade: z.coerce.number().min(0.001, 'Informe a quantidade.').max(100_000),
    valor: z.coerce.number().min(0).max(1_000_000).optional(),
    fornecedor: z.string().trim().max(120).optional(),
    animalId: z.string().optional(),
    data: z.string().min(1),
    observacao: z.string().trim().max(300).optional(),
    lancarDespesa: z.coerce.boolean().default(true),
  });

  const bruto = esquema.safeParse({
    itemId: dados.get('itemId'),
    tipo: dados.get('tipo'),
    quantidade: dados.get('quantidade'),
    valor: dados.get('valor') || undefined,
    fornecedor: dados.get('fornecedor') || undefined,
    animalId: dados.get('animalId') || undefined,
    data: dados.get('data'),
    observacao: dados.get('observacao') || undefined,
    lancarDespesa: dados.get('lancarDespesa') === 'on',
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };
  const e = bruto.data;

  const item = await db.itemEstoque.findUnique({
    where: { id: e.itemId },
    select: { nome: true, tipo: true, saldo: true, unidade: true },
  });
  if (!item) return { erro: 'Item não encontrado.' };

  const saldoAtual = Number(item.saldo);
  const delta =
    e.tipo === 'ENTRADA' ? e.quantidade : e.tipo === 'AJUSTE' ? e.quantidade - saldoAtual : -e.quantidade;

  if (saldoAtual + delta < 0) {
    return {
      erro: `Saldo insuficiente: há ${saldoAtual} ${item.unidade} de ${item.nome} em estoque.`,
    };
  }

  await db.$transaction(async (tx) => {
    await tx.movimentoEstoque.create({
      data: {
        itemId: e.itemId,
        tipo: e.tipo,
        quantidade: e.tipo === 'AJUSTE' ? Math.abs(delta) : e.quantidade,
        valor: e.valor ?? null,
        fornecedor: e.fornecedor,
        animalId: e.animalId || null,
        data: new Date(e.data),
        observacao: e.observacao,
      },
    });

    await tx.itemEstoque.update({
      where: { id: e.itemId },
      data: { saldo: { increment: delta } },
    });

    if (e.tipo === 'ENTRADA' && e.valor && e.valor > 0 && e.lancarDespesa) {
      await tx.despesa.create({
        data: {
          categoria:
            item.tipo === 'RACAO' ? 'ALIMENTACAO' : item.tipo === 'MEDICAMENTO' ? 'MEDICAMENTO' : 'HIGIENE',
          animalId: e.animalId || null,
          descricao: `${item.nome} — ${e.quantidade} ${item.unidade}`,
          valor: e.valor,
          data: new Date(e.data),
          fornecedor: e.fornecedor,
        },
      });
    }
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: `estoque.${e.tipo.toLowerCase()}`,
    entidade: 'ItemEstoque',
    entidadeId: e.itemId,
    detalhe: { item: item.nome, quantidade: e.quantidade, valor: e.valor ?? 0 },
  });

  revalidatePath('/alimentacao');
  revalidatePath('/painel');
  return { ok: 'Movimento registrado.' };
}
