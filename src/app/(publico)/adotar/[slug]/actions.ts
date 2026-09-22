'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, registrarAuditoria } from '@/lib/auth';

const esquema = z.object({
  animalId: z.string().min(1),
  nome: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  telefone: z.string().trim().min(8, 'Informe um telefone para contato.').max(30),
  cidade: z.string().trim().max(80).optional(),
  moradia: z.string().trim().max(60),
  temOutrosAnimais: z.string().trim().max(200).optional(),
  rotina: z.string().trim().max(1200).optional(),
});

export type EstadoAdocao = { ok: false; erro?: string } | { ok: true; animal: string };

/**
 * Interesse em adoção. Não aprova nada: abre um processo com status
 * INTERESSE, que a equipe conduz na área de adoções. Adoção por
 * formulário automático é como animal volta para a rua.
 */
export async function manifestarInteresse(
  _anterior: EstadoAdocao,
  dados: FormData,
): Promise<EstadoAdocao> {
  await conferirMesmaOrigem();

  const bruto = esquema.safeParse({
    animalId: dados.get('animalId'),
    nome: dados.get('nome'),
    email: dados.get('email'),
    telefone: dados.get('telefone'),
    cidade: dados.get('cidade') || undefined,
    moradia: dados.get('moradia'),
    temOutrosAnimais: dados.get('temOutrosAnimais') || undefined,
    rotina: dados.get('rotina') || undefined,
  });

  if (!bruto.success) {
    return { ok: false, erro: bruto.error.issues[0]?.message ?? 'Confira os dados informados.' };
  }
  const entrada = bruto.data;

  const animal = await db.animal.findFirst({
    where: { id: entrada.animalId, deletadoEm: null, status: 'DISPONIVEL_ADOCAO' },
    select: { id: true, nome: true },
  });
  if (!animal) return { ok: false, erro: 'Este AUmigo não está disponível para adoção agora.' };

  const jaAberto = await db.adocao.findFirst({
    where: {
      animalId: animal.id,
      adotanteEmail: entrada.email,
      status: { in: ['INTERESSE', 'ENTREVISTA', 'VISITA', 'APROVADA'] },
    },
  });
  if (jaAberto) {
    return {
      ok: false,
      erro: `Você já manifestou interesse pelo ${animal.nome}. A equipe entra em contato em breve.`,
    };
  }

  await db.adocao.create({
    data: {
      animalId: animal.id,
      adotanteNome: entrada.nome,
      adotanteEmail: entrada.email,
      adotanteTelefone: entrada.telefone,
      adotanteCidade: entrada.cidade,
      respostas: {
        moradia: entrada.moradia,
        outrosAnimais: entrada.temOutrosAnimais ?? null,
        rotina: entrada.rotina ?? null,
      },
    },
  });

  await registrarAuditoria({
    acao: 'adocao.interesse',
    entidade: 'Adocao',
    entidadeId: animal.id,
    detalhe: { animal: animal.nome, email: entrada.email },
  });

  return { ok: true, animal: animal.nome };
}
