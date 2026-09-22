'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, exigirEquipe, registrarAuditoria } from '@/lib/auth';
import { gerarSlug, slugUnico } from '@/lib/slug';
import { guardar, mimeDeImagemOuVideo } from '@/lib/storage';

const animalEsquema = z.object({
  nome: z.string().trim().min(2, 'O nome é obrigatório.').max(60),
  especie: z.enum(['CANINA', 'FELINA', 'OUTRA']),
  sexo: z.enum(['MACHO', 'FEMEA', 'NAO_INFORMADO']),
  porte: z.enum(['PEQUENO', 'MEDIO', 'GRANDE']),
  raca: z.string().trim().max(60).optional(),
  pelagem: z.string().trim().max(60).optional(),
  dataNascimento: z.string().optional(),
  idadeAproximada: z.string().trim().max(40).optional(),
  dataResgate: z.string().min(1, 'Informe a data do resgate.'),
  localResgate: z.string().trim().max(120).optional(),
  historiaResgate: z.string().trim().max(4000).optional(),
  personalidade: z.string().trim().max(1000).optional(),
  castrado: z.coerce.boolean().default(false),
  vacinasEmDia: z.coerce.boolean().default(false),
  necessidadeEspecial: z.coerce.boolean().default(false),
  descricaoNecessidade: z.string().trim().max(1000).optional(),
  status: z.enum([
    'EM_TRATAMENTO',
    'DISPONIVEL_ADOCAO',
    'EM_PROCESSO_ADOCAO',
    'ADOTADO',
    'INDISPONIVEL',
    'FALECIDO',
  ]),
  localAbrigo: z.string().trim().max(80).optional(),
  pesoAtualKg: z.coerce.number().min(0).max(120).optional(),
  custoAlimentacao: z.coerce.number().min(0).max(100_000).default(0),
  custoTratamento: z.coerce.number().min(0).max(100_000).default(0),
  custoMedicamento: z.coerce.number().min(0).max(100_000).default(0),
  destaque: z.coerce.boolean().default(false),
});

function lerFormulario(dados: FormData) {
  const bool = (chave: string) => dados.get(chave) === 'on';
  return animalEsquema.safeParse({
    nome: dados.get('nome'),
    especie: dados.get('especie'),
    sexo: dados.get('sexo'),
    porte: dados.get('porte'),
    raca: dados.get('raca') || undefined,
    pelagem: dados.get('pelagem') || undefined,
    dataNascimento: dados.get('dataNascimento') || undefined,
    idadeAproximada: dados.get('idadeAproximada') || undefined,
    dataResgate: dados.get('dataResgate'),
    localResgate: dados.get('localResgate') || undefined,
    historiaResgate: dados.get('historiaResgate') || undefined,
    personalidade: dados.get('personalidade') || undefined,
    castrado: bool('castrado'),
    vacinasEmDia: bool('vacinasEmDia'),
    necessidadeEspecial: bool('necessidadeEspecial'),
    descricaoNecessidade: dados.get('descricaoNecessidade') || undefined,
    status: dados.get('status'),
    localAbrigo: dados.get('localAbrigo') || undefined,
    pesoAtualKg: dados.get('pesoAtualKg') || undefined,
    custoAlimentacao: dados.get('custoAlimentacao') || 0,
    custoTratamento: dados.get('custoTratamento') || 0,
    custoMedicamento: dados.get('custoMedicamento') || 0,
    destaque: bool('destaque'),
  });
}

export type EstadoAnimal = { erro?: string };

export async function criarAnimal(_anterior: EstadoAnimal, dados: FormData): Promise<EstadoAnimal> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const bruto = lerFormulario(dados);
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };
  const e = bruto.data;

  const existentes = new Set(
    (await db.animal.findMany({ select: { slug: true } })).map((a) => a.slug),
  );

  const animal = await db.animal.create({
    data: {
      ...e,
      slug: slugUnico(gerarSlug(e.nome), existentes),
      dataNascimento: e.dataNascimento ? new Date(e.dataNascimento) : null,
      dataResgate: new Date(e.dataResgate),
      pesoAtualKg: e.pesoAtualKg ?? null,
    },
  });

  // O resgate abre a linha do tempo. Sem isso o diário do animal começa
  // pela primeira consulta, e a história perde justamente o começo.
  await db.eventoDiario.create({
    data: {
      animalId: animal.id,
      tipo: 'RESGATE',
      data: new Date(e.dataResgate),
      titulo: `${animal.nome} foi resgatado.`,
      descricao: e.localResgate ? `Resgatado em ${e.localResgate}.` : undefined,
      automatico: true,
      autorId: usuario.id,
    },
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'animal.criado',
    entidade: 'Animal',
    entidadeId: animal.id,
    detalhe: { nome: animal.nome },
  });

  redirect(`/animais-ong/${animal.id}`);
}

export async function atualizarAnimal(
  _anterior: EstadoAnimal,
  dados: FormData,
): Promise<EstadoAnimal> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const id = String(dados.get('id') ?? '');
  if (!id) return { erro: 'Animal não identificado.' };

  const bruto = lerFormulario(dados);
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };
  const e = bruto.data;

  const anterior = await db.animal.findUnique({ where: { id }, select: { status: true, nome: true, slug: true } });
  if (!anterior) return { erro: 'Animal não encontrado.' };

  await db.animal.update({
    where: { id },
    data: {
      ...e,
      dataNascimento: e.dataNascimento ? new Date(e.dataNascimento) : null,
      dataResgate: new Date(e.dataResgate),
      pesoAtualKg: e.pesoAtualKg ?? null,
      // O slug NÃO muda junto com o nome: o link já circulou no WhatsApp
      // e no Instagram, e mudá-lo quebra a captação que já está em curso.
    },
  });

  // Adoção concluída é acontecimento, não mudança de campo: entra no
  // diário sozinha, porque é o fim feliz que a página pública mostra.
  if (anterior.status !== 'ADOTADO' && e.status === 'ADOTADO') {
    await db.eventoDiario.create({
      data: {
        animalId: id,
        tipo: 'ADOCAO',
        data: new Date(),
        titulo: `${e.nome} foi adotado! 🏡`,
        automatico: true,
        autorId: usuario.id,
      },
    });
  }

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'animal.atualizado',
    entidade: 'Animal',
    entidadeId: id,
    detalhe: { nome: e.nome, status: e.status },
  });

  revalidatePath(`/animais-ong/${id}`);
  revalidatePath(`/animais/${anterior.slug}`);
  redirect(`/animais-ong/${id}`);
}

// ----------------------------------------------------------
// Diário
// ----------------------------------------------------------

export async function registrarEvento(_anterior: EstadoAnimal, dados: FormData): Promise<EstadoAnimal> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    animalId: z.string().min(1),
    tipo: z.enum([
      'RESGATE',
      'CONSULTA',
      'TRATAMENTO',
      'MELHORA',
      'PASSEIO',
      'APADRINHAMENTO',
      'VACINA',
      'CASTRACAO',
      'ADOCAO',
      'ANIVERSARIO',
      'OUTRO',
    ]),
    data: z.string().min(1),
    titulo: z.string().trim().min(3, 'Escreva um título para o evento.').max(140),
    descricao: z.string().trim().max(2000).optional(),
    interno: z.coerce.boolean().default(false),
  });

  const bruto = esquema.safeParse({
    animalId: dados.get('animalId'),
    tipo: dados.get('tipo'),
    data: dados.get('data'),
    titulo: dados.get('titulo'),
    descricao: dados.get('descricao') || undefined,
    interno: dados.get('interno') === 'on',
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };

  await db.eventoDiario.create({
    data: { ...bruto.data, data: new Date(bruto.data.data), autorId: usuario.id },
  });

  revalidatePath(`/animais-ong/${bruto.data.animalId}`);
  return {};
}

// ----------------------------------------------------------
// Atualização para os padrinhos
// ----------------------------------------------------------

export async function publicarAtualizacao(
  _anterior: EstadoAnimal,
  dados: FormData,
): Promise<EstadoAnimal> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const esquema = z.object({
    animalId: z.string().min(1),
    titulo: z.string().trim().min(3, 'Escreva um título.').max(140),
    texto: z.string().trim().min(10, 'Escreva a novidade que os padrinhos vão receber.').max(4000),
    publica: z.coerce.boolean().default(false),
  });

  const bruto = esquema.safeParse({
    animalId: dados.get('animalId'),
    titulo: dados.get('titulo'),
    texto: dados.get('texto'),
    publica: dados.get('publica') === 'on',
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };
  const e = bruto.data;

  const animal = await db.animal.findUnique({
    where: { id: e.animalId },
    select: {
      nome: true,
      slug: true,
      apadrinhamentos: {
        where: { status: 'ATIVO' },
        select: { padrinhoId: true, padrinho: { select: { aceitaNotificacao: true } } },
      },
    },
  });
  if (!animal) return { erro: 'Animal não encontrado.' };

  await db.$transaction(async (tx) => {
    await tx.atualizacaoAnimal.create({
      data: { ...e, autorId: usuario.id },
    });

    // Um padrinho pode apadrinhar o mesmo animal duas vezes ao longo do
    // tempo; o Set evita mandar a mesma novidade duas vezes para ele.
    const destinatarios = [
      ...new Set(
        animal.apadrinhamentos
          .filter((a) => a.padrinho.aceitaNotificacao)
          .map((a) => a.padrinhoId),
      ),
    ];

    if (destinatarios.length > 0) {
      await tx.notificacao.createMany({
        data: destinatarios.map((padrinhoId) => ({
          padrinhoId,
          animalId: e.animalId,
          tipo: 'ATUALIZACAO_ANIMAL' as const,
          titulo: `Novidade sobre o ${animal.nome}! 🐶`,
          corpo: e.titulo,
          link: `/meus-aumigos/${animal.slug}`,
        })),
      });
    }
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'animal.atualizacao_publicada',
    entidade: 'Animal',
    entidadeId: e.animalId,
    detalhe: { titulo: e.titulo, padrinhos: animal.apadrinhamentos.length },
  });

  revalidatePath(`/animais-ong/${e.animalId}`);
  revalidatePath(`/animais/${animal.slug}`);
  return {};
}

// ----------------------------------------------------------
// Fotos
// ----------------------------------------------------------

export async function enviarFoto(_anterior: EstadoAnimal, dados: FormData): Promise<EstadoAnimal> {
  await conferirMesmaOrigem();
  const usuario = await exigirEquipe();

  const animalId = String(dados.get('animalId') ?? '');
  const arquivo = dados.get('arquivo');
  const legenda = String(dados.get('legenda') ?? '').trim() || undefined;
  const virarCapa = dados.get('capa') === 'on';

  if (!animalId || !(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: 'Escolha uma foto ou vídeo.' };
  }
  if (!mimeDeImagemOuVideo(arquivo.type)) {
    return { erro: 'Formato não aceito. Use JPG, PNG, WEBP ou MP4.' };
  }
  if (arquivo.size > 25 * 1024 * 1024) {
    return { erro: 'Arquivo acima de 25 MB. Reduza antes de enviar.' };
  }

  const { arquivo: nome, bytes } = await guardar(
    'animais',
    Buffer.from(await arquivo.arrayBuffer()),
    arquivo.type,
  );

  const ultima = await db.foto.findFirst({
    where: { animalId },
    orderBy: { ordem: 'desc' },
    select: { ordem: true },
  });

  const foto = await db.foto.create({
    data: {
      animalId,
      tipo: arquivo.type.startsWith('video/') ? 'VIDEO' : 'FOTO',
      arquivo: nome,
      mimeType: arquivo.type,
      bytes,
      legenda,
      ordem: (ultima?.ordem ?? 0) + 1,
    },
  });

  // Vídeo nunca vira capa: o preview do link compartilhado precisa de
  // imagem, e um MP4 ali resulta em retângulo cinza no WhatsApp.
  const animal = await db.animal.findUnique({ where: { id: animalId }, select: { fotoCapaId: true, slug: true } });
  if (foto.tipo === 'FOTO' && (virarCapa || !animal?.fotoCapaId)) {
    await db.animal.update({ where: { id: animalId }, data: { fotoCapaId: foto.id } });
  }

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'animal.foto_enviada',
    entidade: 'Animal',
    entidadeId: animalId,
  });

  revalidatePath(`/animais-ong/${animalId}`);
  if (animal?.slug) revalidatePath(`/animais/${animal.slug}`);
  return {};
}

export async function definirCapa(animalId: string, fotoId: string): Promise<void> {
  await conferirMesmaOrigem();
  await exigirEquipe();
  await db.animal.update({ where: { id: animalId }, data: { fotoCapaId: fotoId } });
  revalidatePath(`/animais-ong/${animalId}`);
}
