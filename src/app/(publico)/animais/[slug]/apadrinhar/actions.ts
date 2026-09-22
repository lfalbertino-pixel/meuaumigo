'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, registrarAuditoria } from '@/lib/auth';
import { inicioDoMes } from '@/server/periodo';

/**
 * O apadrinhamento nasce aqui, e é o único fluxo do sistema aberto a
 * quem não tem login. Por isso ele é conservador: nada que o visitante
 * digita vira permissão, e o pagamento entra como PENDENTE — quem marca
 * como paga é a equipe, conferindo o extrato.
 */

const VALORES_MODALIDADE = {
  ALIMENTACAO: 30,
  CUIDADOS: 50,
  COMPLETO: 100,
} as const;

const esquema = z.object({
  animalId: z.string().min(1),
  nome: z.string().trim().min(3, 'Informe seu nome completo.').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  telefone: z.string().trim().max(30).optional(),
  documento: z.string().trim().max(20).optional(),
  cidade: z.string().trim().max(80).optional(),
  modalidade: z.enum(['ALIMENTACAO', 'CUIDADOS', 'COMPLETO', 'PERSONALIZADO']),
  valorPersonalizado: z.coerce.number().min(10).max(10_000).optional(),
  exibirNoPerfil: z.coerce.boolean().default(true),
  aceitaNotificacao: z.coerce.boolean().default(true),
});

export type EstadoApadrinhamento =
  | { ok: false; erro?: string }
  | { ok: true; padrinho: string; animal: string; valor: number };

export async function apadrinhar(
  _anterior: EstadoApadrinhamento,
  dados: FormData,
): Promise<EstadoApadrinhamento> {
  await conferirMesmaOrigem();

  const bruto = esquema.safeParse({
    animalId: dados.get('animalId'),
    nome: dados.get('nome'),
    email: dados.get('email'),
    telefone: dados.get('telefone') || undefined,
    documento: dados.get('documento') || undefined,
    cidade: dados.get('cidade') || undefined,
    modalidade: dados.get('modalidade'),
    valorPersonalizado: dados.get('valorPersonalizado') || undefined,
    exibirNoPerfil: dados.get('exibirNoPerfil') === 'on',
    aceitaNotificacao: dados.get('aceitaNotificacao') === 'on',
  });

  if (!bruto.success) {
    return { ok: false, erro: bruto.error.issues[0]?.message ?? 'Confira os dados informados.' };
  }
  const entrada = bruto.data;

  if (entrada.modalidade === 'PERSONALIZADO' && !entrada.valorPersonalizado) {
    return { ok: false, erro: 'Informe quanto você quer contribuir por mês.' };
  }

  const valorMensal =
    entrada.modalidade === 'PERSONALIZADO'
      ? entrada.valorPersonalizado!
      : VALORES_MODALIDADE[entrada.modalidade];

  const animal = await db.animal.findFirst({
    where: { id: entrada.animalId, deletadoEm: null, ativo: true },
    select: { id: true, nome: true, slug: true, _count: { select: { apadrinhamentos: true } } },
  });
  if (!animal) return { ok: false, erro: 'Este AUmigo não está mais disponível para apadrinhamento.' };

  // Quem já é padrinho não vira um cadastro novo — vira mais um
  // apadrinhamento no mesmo nome. O e-mail é a chave.
  const padrinho = await db.padrinho.upsert({
    where: { email: entrada.email },
    create: {
      nome: entrada.nome,
      email: entrada.email,
      telefone: entrada.telefone,
      documento: entrada.documento,
      cidade: entrada.cidade,
      aceitaNotificacao: entrada.aceitaNotificacao,
    },
    update: {
      // Só completa o que está vazio: um cadastro antigo mais rico não
      // pode ser esvaziado por um formulário preenchido às pressas.
      telefone: entrada.telefone || undefined,
      documento: entrada.documento || undefined,
      cidade: entrada.cidade || undefined,
      aceitaNotificacao: entrada.aceitaNotificacao,
      deletadoEm: null,
    },
  });

  const jaApadrinha = await db.apadrinhamento.findFirst({
    where: { padrinhoId: padrinho.id, animalId: animal.id, status: { in: ['ATIVO', 'PAUSADO'] } },
  });
  if (jaApadrinha) {
    return {
      ok: false,
      erro: `Você já apadrinha o ${animal.nome}. Para mudar o valor, fale com a equipe pela sua área de padrinho.`,
    };
  }

  const competencia = inicioDoMes();
  const primeiroPadrinho = animal._count.apadrinhamentos === 0;

  await db.$transaction(async (tx) => {
    const apadrinhamento = await tx.apadrinhamento.create({
      data: {
        padrinhoId: padrinho.id,
        animalId: animal.id,
        modalidade: entrada.modalidade,
        valorMensal,
        exibirNoPerfil: entrada.exibirNoPerfil,
      },
    });

    // A primeira mensalidade já nasce, pendente. Sem ela o apadrinhamento
    // fica invisível no financeiro até alguém lembrar de lançar.
    await tx.contribuicao.create({
      data: {
        origem: 'APADRINHAMENTO',
        apadrinhamentoId: apadrinhamento.id,
        padrinhoId: padrinho.id,
        animalId: animal.id,
        valor: valorMensal,
        status: 'PENDENTE',
        competencia,
        vencimento: new Date(competencia.getFullYear(), competencia.getMonth(), 10),
      },
    });

    if (primeiroPadrinho) {
      await tx.eventoDiario.create({
        data: {
          animalId: animal.id,
          tipo: 'APADRINHAMENTO',
          data: new Date(),
          titulo: `${animal.nome} ganhou seu primeiro padrinho!`,
          automatico: true,
        },
      });
    }

    await tx.notificacao.create({
      data: {
        padrinhoId: padrinho.id,
        animalId: animal.id,
        tipo: 'APADRINHAMENTO_CONFIRMADO',
        titulo: 'Seu apadrinhamento foi registrado ❤️',
        corpo: `Obrigado por cuidar do ${animal.nome}. Assim que confirmarmos o primeiro pagamento, você começa a receber as novidades dele.`,
        link: `/animais/${animal.slug}`,
      },
    });
  });

  await registrarAuditoria({
    acao: 'apadrinhamento.criado',
    entidade: 'Apadrinhamento',
    entidadeId: animal.id,
    detalhe: { animal: animal.nome, padrinho: padrinho.email, valorMensal },
  });

  return { ok: true, padrinho: padrinho.nome, animal: animal.nome, valor: valorMensal };
}
