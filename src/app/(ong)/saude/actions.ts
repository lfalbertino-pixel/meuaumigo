'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, exigirEquipe, registrarAuditoria } from '@/lib/auth';

const esquema = z.object({
  animalId: z.string().min(1),
  tipo: z.enum([
    'CONSULTA',
    'VACINA',
    'VERMIFUGO',
    'CASTRACAO',
    'EXAME',
    'CIRURGIA',
    'MEDICAMENTO',
    'PESAGEM',
    'ALERGIA',
    'DOENCA',
    'OUTRO',
  ]),
  data: z.string().min(1, 'Informe a data.'),
  titulo: z.string().trim().min(3, 'Descreva o que foi feito.').max(140),
  descricao: z.string().trim().max(2000).optional(),
  valor: z.coerce.number().min(0).max(100_000).optional(),
  pesoKg: z.coerce.number().min(0).max(120).optional(),
  proximaData: z.string().optional(),
  medicamento: z.string().trim().max(120).optional(),
  dosagem: z.string().trim().max(120).optional(),
  veterinarioId: z.string().optional(),
  lancarDespesa: z.coerce.boolean().default(true),
});

export type EstadoSaude = { erro?: string; ok?: boolean };

/**
 * Registro clínico. Quando tem valor, ele também vira despesa — com o
 * vínculo guardado, não uma cópia solta.
 *
 * Essa amarração é o que faz o sistema conseguir responder "a consulta
 * do Bolt de 12/09 custou R$ 180" nos dois lugares (ficha de saúde e
 * financeiro) sem que os dois números possam divergir.
 */
export async function registrarSaude(_anterior: EstadoSaude, dados: FormData): Promise<EstadoSaude> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const bruto = esquema.safeParse({
    animalId: dados.get('animalId'),
    tipo: dados.get('tipo'),
    data: dados.get('data'),
    titulo: dados.get('titulo'),
    descricao: dados.get('descricao') || undefined,
    valor: dados.get('valor') || undefined,
    pesoKg: dados.get('pesoKg') || undefined,
    proximaData: dados.get('proximaData') || undefined,
    medicamento: dados.get('medicamento') || undefined,
    dosagem: dados.get('dosagem') || undefined,
    veterinarioId: dados.get('veterinarioId') || undefined,
    lancarDespesa: dados.get('lancarDespesa') === 'on',
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };
  const e = bruto.data;

  const animal = await db.animal.findUnique({
    where: { id: e.animalId },
    select: { id: true, nome: true, slug: true },
  });
  if (!animal) return { erro: 'Animal não encontrado.' };

  await db.$transaction(async (tx) => {
    const registro = await tx.registroSaude.create({
      data: {
        animalId: e.animalId,
        tipo: e.tipo,
        data: new Date(e.data),
        titulo: e.titulo,
        descricao: e.descricao,
        valor: e.valor ?? null,
        pesoKg: e.pesoKg ?? null,
        proximaData: e.proximaData ? new Date(e.proximaData) : null,
        medicamento: e.medicamento,
        dosagem: e.dosagem,
        veterinarioId: e.veterinarioId || null,
      },
    });

    if (e.valor && e.valor > 0 && e.lancarDespesa) {
      await tx.despesa.create({
        data: {
          categoria:
            e.tipo === 'MEDICAMENTO' ? 'MEDICAMENTO' : e.tipo === 'VACINA' ? 'MEDICAMENTO' : 'VETERINARIO',
          animalId: e.animalId,
          descricao: `${e.titulo} — ${animal.nome}`,
          valor: e.valor,
          data: new Date(e.data),
          registroSaudeId: registro.id,
        },
      });
    }

    // A pesagem atualiza o peso atual do animal: a ficha nunca fica
    // mostrando o peso de quando ele chegou.
    if (e.tipo === 'PESAGEM' && e.pesoKg) {
      await tx.animal.update({ where: { id: e.animalId }, data: { pesoAtualKg: e.pesoKg } });
    }

    if (e.tipo === 'CASTRACAO') {
      await tx.animal.update({ where: { id: e.animalId }, data: { castrado: true } });
    }

    // Castração e vacina entram no diário público: são marcos que o
    // padrinho quer ver. Consulta e exame ficam só na ficha clínica.
    if (e.tipo === 'CASTRACAO' || e.tipo === 'VACINA') {
      await tx.eventoDiario.create({
        data: {
          animalId: e.animalId,
          tipo: e.tipo,
          data: new Date(e.data),
          titulo: e.tipo === 'CASTRACAO' ? `${animal.nome} foi castrado.` : e.titulo,
          automatico: true,
          autorId: usuario.id,
        },
      });
    }
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'saude.registrada',
    entidade: 'Animal',
    entidadeId: e.animalId,
    detalhe: { tipo: e.tipo, valor: e.valor ?? 0 },
  });

  revalidatePath(`/animais-ong/${e.animalId}`);
  revalidatePath('/saude');
  revalidatePath(`/animais/${animal.slug}`);
  return { ok: true };
}
