'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, exigirEquipe, registrarAuditoria } from '@/lib/auth';

export type EstadoApadrinhamento = { erro?: string; ok?: boolean };

/**
 * Mudar um apadrinhamento mexe na renda recorrente da ONG e na relação
 * com uma pessoa que confia nela. Por isso tudo aqui passa por auditoria,
 * e cancelamento exige motivo: daqui a seis meses alguém vai querer
 * saber por que a receita caiu naquele mês.
 */
export async function mudarStatus(
  _anterior: EstadoApadrinhamento,
  dados: FormData,
): Promise<EstadoApadrinhamento> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    id: z.string().min(1),
    status: z.enum(['ATIVO', 'PAUSADO', 'CANCELADO']),
    motivo: z.string().trim().max(400).optional(),
  });

  const bruto = esquema.safeParse({
    id: dados.get('id'),
    status: dados.get('status'),
    motivo: dados.get('motivo') || undefined,
  });
  if (!bruto.success) return { erro: 'Dados inválidos.' };
  const e = bruto.data;

  if (e.status === 'CANCELADO' && !e.motivo) {
    return { erro: 'Informe o motivo do cancelamento.' };
  }

  const atual = await db.apadrinhamento.findUnique({
    where: { id: e.id },
    select: { animalId: true, padrinhoId: true, valorMensal: true, status: true },
  });
  if (!atual) return { erro: 'Apadrinhamento não encontrado.' };

  await db.apadrinhamento.update({
    where: { id: e.id },
    data: {
      status: e.status,
      motivoCancelamento: e.status === 'CANCELADO' ? e.motivo : null,
      // A data de fim alimenta o gráfico de cancelamentos do painel;
      // reativar limpa, senão o mês antigo continua contando a saída.
      fim: e.status === 'CANCELADO' ? new Date() : null,
    },
  });

  if (e.status === 'CANCELADO') {
    // Mensalidade futura de apadrinhamento cancelado vira cobrança
    // indevida. Só o que já foi pago fica.
    await db.contribuicao.updateMany({
      where: { apadrinhamentoId: e.id, status: { in: ['PENDENTE', 'ATRASADA'] } },
      data: { status: 'CANCELADA' },
    });
  }

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: `apadrinhamento.${e.status.toLowerCase()}`,
    entidade: 'Apadrinhamento',
    entidadeId: e.id,
    detalhe: { de: atual.status, para: e.status, motivo: e.motivo ?? null },
  });

  revalidatePath('/apadrinhamentos');
  revalidatePath(`/animais-ong/${atual.animalId}`);
  revalidatePath(`/padrinhos/${atual.padrinhoId}`);
  return { ok: true };
}

export async function alterarValor(
  _anterior: EstadoApadrinhamento,
  dados: FormData,
): Promise<EstadoApadrinhamento> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    id: z.string().min(1),
    valorMensal: z.coerce.number().min(10, 'O valor mínimo é R$ 10.').max(10_000),
  });

  const bruto = esquema.safeParse({
    id: dados.get('id'),
    valorMensal: dados.get('valorMensal'),
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };

  const atual = await db.apadrinhamento.findUnique({
    where: { id: bruto.data.id },
    select: { valorMensal: true, animalId: true, padrinhoId: true },
  });
  if (!atual) return { erro: 'Apadrinhamento não encontrado.' };

  await db.apadrinhamento.update({
    where: { id: bruto.data.id },
    data: { valorMensal: bruto.data.valorMensal, modalidade: 'PERSONALIZADO' },
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'apadrinhamento.valor_alterado',
    entidade: 'Apadrinhamento',
    entidadeId: bruto.data.id,
    detalhe: { de: Number(atual.valorMensal), para: bruto.data.valorMensal },
  });

  revalidatePath('/apadrinhamentos');
  revalidatePath(`/animais-ong/${atual.animalId}`);
  return { ok: true };
}
