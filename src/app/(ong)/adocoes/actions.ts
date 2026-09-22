'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, exigirEquipe, registrarAuditoria } from '@/lib/auth';

export type EstadoAdocao = { erro?: string; ok?: boolean };

/**
 * O funil da adoção. Mudar o status daqui também mexe no status do
 * animal — é o mesmo fato visto de dois lugares, e deixar os dois
 * dessincronizados é como um animal "adotado" continua aparecendo na
 * vitrine pública.
 */
export async function mudarStatusAdocao(
  _anterior: EstadoAdocao,
  dados: FormData,
): Promise<EstadoAdocao> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    id: z.string().min(1),
    status: z.enum(['INTERESSE', 'ENTREVISTA', 'VISITA', 'APROVADA', 'CONCLUIDA', 'RECUSADA', 'DESISTENCIA']),
    observacoes: z.string().trim().max(1000).optional(),
  });

  const bruto = esquema.safeParse({
    id: dados.get('id'),
    status: dados.get('status'),
    observacoes: dados.get('observacoes') || undefined,
  });
  if (!bruto.success) return { erro: 'Dados inválidos.' };
  const e = bruto.data;

  const adocao = await db.adocao.findUnique({
    where: { id: e.id },
    select: { animalId: true, adotanteNome: true, animal: { select: { nome: true, slug: true } } },
  });
  if (!adocao) return { erro: 'Processo não encontrado.' };

  await db.$transaction(async (tx) => {
    await tx.adocao.update({
      where: { id: e.id },
      data: {
        status: e.status,
        observacoes: e.observacoes,
        concluidaEm: e.status === 'CONCLUIDA' ? new Date() : null,
      },
    });

    if (e.status === 'CONCLUIDA') {
      await tx.animal.update({
        where: { id: adocao.animalId },
        data: { status: 'ADOTADO', ativo: false },
      });
      await tx.eventoDiario.create({
        data: {
          animalId: adocao.animalId,
          tipo: 'ADOCAO',
          data: new Date(),
          titulo: `${adocao.animal.nome} foi adotado! 🏡`,
          descricao: `${adocao.animal.nome} encontrou uma família.`,
          automatico: true,
          autorId: usuario.id,
        },
      });
    } else if (['ENTREVISTA', 'VISITA', 'APROVADA'].includes(e.status)) {
      await tx.animal.update({
        where: { id: adocao.animalId },
        data: { status: 'EM_PROCESSO_ADOCAO' },
      });
    } else if (['RECUSADA', 'DESISTENCIA'].includes(e.status)) {
      // Só volta para a vitrine se nenhum outro processo estiver correndo.
      const outros = await tx.adocao.count({
        where: {
          animalId: adocao.animalId,
          id: { not: e.id },
          status: { in: ['INTERESSE', 'ENTREVISTA', 'VISITA', 'APROVADA'] },
        },
      });
      if (outros === 0) {
        await tx.animal.update({
          where: { id: adocao.animalId },
          data: { status: 'DISPONIVEL_ADOCAO' },
        });
      }
    }
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: `adocao.${e.status.toLowerCase()}`,
    entidade: 'Adocao',
    entidadeId: e.id,
    detalhe: { animal: adocao.animal.nome, adotante: adocao.adotanteNome },
  });

  revalidatePath('/adocoes');
  revalidatePath(`/animais-ong/${adocao.animalId}`);
  revalidatePath(`/animais/${adocao.animal.slug}`);
  return { ok: true };
}
