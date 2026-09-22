'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, registrarAuditoria } from '@/lib/auth';
import { inicioDoMes } from '@/server/periodo';

const esquema = z.object({
  campanhaId: z.string().min(1),
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  valor: z.coerce.number().min(5, 'O valor mínimo é R$ 5.').max(100_000),
  anonima: z.coerce.boolean().default(false),
});

export type EstadoDoacao = { ok: false; erro?: string } | { ok: true; valor: number };

/**
 * Doação para campanha. Entra como PENDENTE e só vira PAGA quando a
 * equipe conferir o extrato: o sistema não tem integração com gateway,
 * e inventar um "pago" que ninguém verificou estragaria justamente o
 * número que a página de transparência mostra.
 */
export async function doar(_anterior: EstadoDoacao, dados: FormData): Promise<EstadoDoacao> {
  await conferirMesmaOrigem();

  const bruto = esquema.safeParse({
    campanhaId: dados.get('campanhaId'),
    nome: dados.get('nome'),
    email: dados.get('email') ?? '',
    valor: dados.get('valor'),
    anonima: dados.get('anonima') === 'on',
  });

  if (!bruto.success) {
    return { ok: false, erro: bruto.error.issues[0]?.message ?? 'Confira os dados informados.' };
  }
  const entrada = bruto.data;

  const campanha = await db.campanha.findFirst({
    where: { id: entrada.campanhaId, status: 'ATIVA' },
    select: { id: true, slug: true, titulo: true, animalId: true },
  });
  if (!campanha) return { ok: false, erro: 'Esta campanha não está mais aberta.' };

  const padrinho = entrada.email
    ? await db.padrinho.findUnique({ where: { email: entrada.email }, select: { id: true } })
    : null;

  await db.contribuicao.create({
    data: {
      origem: 'CAMPANHA',
      campanhaId: campanha.id,
      animalId: campanha.animalId,
      padrinhoId: padrinho?.id,
      nomeDoador: entrada.anonima ? null : entrada.nome,
      anonima: entrada.anonima,
      valor: entrada.valor,
      status: 'PENDENTE',
      competencia: inicioDoMes(),
    },
  });

  await registrarAuditoria({
    acao: 'campanha.doacao',
    entidade: 'Campanha',
    entidadeId: campanha.id,
    detalhe: { campanha: campanha.titulo, valor: entrada.valor },
  });

  revalidatePath(`/campanhas/${campanha.slug}`);
  return { ok: true, valor: entrada.valor };
}
