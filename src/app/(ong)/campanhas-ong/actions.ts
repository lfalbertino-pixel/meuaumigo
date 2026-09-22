'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, exigirEquipe, registrarAuditoria } from '@/lib/auth';
import { gerarSlug, slugUnico } from '@/lib/slug';

export type EstadoCampanha = { erro?: string; ok?: string };

export async function criarCampanha(
  _anterior: EstadoCampanha,
  dados: FormData,
): Promise<EstadoCampanha> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    titulo: z.string().trim().min(5, 'Escreva um título que chame atenção.').max(140),
    animalId: z.string().optional(),
    resumo: z.string().trim().min(10, 'Escreva um resumo de uma ou duas frases.').max(400),
    texto: z.string().trim().max(4000).optional(),
    meta: z.coerce.number().min(50, 'A meta mínima é R$ 50.').max(1_000_000),
    prazo: z.string().optional(),
    urgente: z.coerce.boolean().default(false),
    publicar: z.coerce.boolean().default(false),
  });

  const bruto = esquema.safeParse({
    titulo: dados.get('titulo'),
    animalId: dados.get('animalId') || undefined,
    resumo: dados.get('resumo'),
    texto: dados.get('texto') || undefined,
    meta: dados.get('meta'),
    prazo: dados.get('prazo') || undefined,
    urgente: dados.get('urgente') === 'on',
    publicar: dados.get('publicar') === 'on',
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };
  const e = bruto.data;

  const existentes = new Set(
    (await db.campanha.findMany({ select: { slug: true } })).map((c) => c.slug),
  );

  const campanha = await db.campanha.create({
    data: {
      slug: slugUnico(gerarSlug(e.titulo), existentes),
      titulo: e.titulo,
      animalId: e.animalId || null,
      resumo: e.resumo,
      texto: e.texto,
      meta: e.meta,
      prazo: e.prazo ? new Date(e.prazo) : null,
      urgente: e.urgente,
      status: e.publicar ? 'ATIVA' : 'RASCUNHO',
    },
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'campanha.criada',
    entidade: 'Campanha',
    entidadeId: campanha.id,
    detalhe: { titulo: e.titulo, meta: e.meta },
  });

  revalidatePath('/campanhas-ong');
  revalidatePath('/campanhas');
  return { ok: e.publicar ? 'Campanha publicada.' : 'Campanha salva como rascunho.' };
}

export async function mudarStatusCampanha(
  _anterior: EstadoCampanha,
  dados: FormData,
): Promise<EstadoCampanha> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    id: z.string().min(1),
    status: z.enum(['RASCUNHO', 'ATIVA', 'CONCLUIDA', 'ENCERRADA']),
  });

  const bruto = esquema.safeParse({ id: dados.get('id'), status: dados.get('status') });
  if (!bruto.success) return { erro: 'Dados inválidos.' };

  const campanha = await db.campanha.update({
    where: { id: bruto.data.id },
    data: {
      status: bruto.data.status,
      encerradaEm:
        bruto.data.status === 'CONCLUIDA' || bruto.data.status === 'ENCERRADA' ? new Date() : null,
    },
    select: { titulo: true, animalId: true },
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: `campanha.${bruto.data.status.toLowerCase()}`,
    entidade: 'Campanha',
    entidadeId: bruto.data.id,
    detalhe: { titulo: campanha.titulo },
  });

  revalidatePath('/campanhas-ong');
  revalidatePath('/campanhas');
  if (campanha.animalId) revalidatePath(`/animais-ong/${campanha.animalId}`);
  return { ok: 'Campanha atualizada.' };
}
