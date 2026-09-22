import type { Especie, Porte, Prisma, Sexo } from '@prisma/client';
import { db } from '@/lib/db';
import { faixaEtaria, normalizar, paraNumero, type FaixaEtaria } from '@/lib/format';
import { calcularCusto, selecaoCusto, type CustoAnimal } from './custos';

/**
 * A vitrine pública — "Encontre seu AUmigo". É a porta de entrada de
 * padrinho novo, então ela é otimista de propósito: anima quem precisa
 * de apoio antes de quem já está coberto.
 */

export type FiltroVitrine = {
  busca?: string;
  especie?: Especie;
  sexo?: Sexo;
  porte?: Porte;
  faixa?: FaixaEtaria;
  necessidadeEspecial?: boolean;
  /** 'precisa' = sem padrinho ativo; 'apadrinhado' = já tem. */
  apadrinhamento?: 'precisa' | 'apadrinhado';
  adocao?: boolean;
};

export type CartaoAnimal = {
  id: string;
  slug: string;
  nome: string;
  especie: Especie;
  sexo: Sexo;
  porte: Porte;
  idade: string;
  faixa: FaixaEtaria | null;
  necessidadeEspecial: boolean;
  status: string;
  destaque: boolean;
  fotoId: string | null;
  custo: CustoAnimal;
};

export async function listarVitrine(filtro: FiltroVitrine = {}): Promise<CartaoAnimal[]> {
  const where: Prisma.AnimalWhereInput = {
    ativo: true,
    deletadoEm: null,
    status: { notIn: ['FALECIDO', 'INDISPONIVEL'] },
  };

  if (filtro.especie) where.especie = filtro.especie;
  if (filtro.sexo) where.sexo = filtro.sexo;
  if (filtro.porte) where.porte = filtro.porte;
  if (filtro.necessidadeEspecial) where.necessidadeEspecial = true;
  if (filtro.adocao) where.status = 'DISPONIVEL_ADOCAO';

  if (filtro.apadrinhamento === 'precisa') {
    where.apadrinhamentos = { none: { status: 'ATIVO' } };
  } else if (filtro.apadrinhamento === 'apadrinhado') {
    where.apadrinhamentos = { some: { status: 'ATIVO' } };
  }

  if (filtro.busca?.trim()) {
    const termo = filtro.busca.trim();
    where.OR = [
      { nome: { contains: termo, mode: 'insensitive' } },
      { raca: { contains: termo, mode: 'insensitive' } },
      { historiaResgate: { contains: termo, mode: 'insensitive' } },
    ];
  }

  const animais = await db.animal.findMany({
    where,
    orderBy: [{ destaque: 'desc' }, { dataResgate: 'desc' }],
    select: {
      id: true,
      slug: true,
      nome: true,
      especie: true,
      sexo: true,
      porte: true,
      status: true,
      destaque: true,
      dataNascimento: true,
      idadeAproximada: true,
      necessidadeEspecial: true,
      fotoCapaId: true,
      ...selecaoCusto,
    },
  });

  const cartoes = animais.map((a) => ({
    id: a.id,
    slug: a.slug,
    nome: a.nome,
    especie: a.especie,
    sexo: a.sexo,
    porte: a.porte,
    idade: a.idadeAproximada ?? '',
    faixa: faixaEtaria(a),
    necessidadeEspecial: a.necessidadeEspecial,
    status: a.status,
    destaque: a.destaque,
    fotoId: a.fotoCapaId,
    custo: calcularCusto(a),
    _nascimento: a.dataNascimento,
  }));

  // A faixa etária depende de campo calculado (nascimento OU estimativa
  // escrita à mão), então ela não cabe no `where` do Prisma.
  const filtrados = filtro.faixa ? cartoes.filter((c) => c.faixa === filtro.faixa) : cartoes;

  return filtrados.map(({ _nascimento, ...resto }) => resto);
}

/** Perfil público do animal: história, galeria, saúde resumida e a meta. */
export async function carregarPerfilPublico(slug: string) {
  const animal = await db.animal.findFirst({
    where: { slug, deletadoEm: null },
    include: {
      fotoCapa: true,
      fotos: { orderBy: { ordem: 'asc' } },
      apadrinhamentos: {
        where: { status: 'ATIVO' },
        select: {
          id: true,
          valorMensal: true,
          status: true,
          inicio: true,
          exibirNoPerfil: true,
          padrinho: { select: { nome: true, perfilPublico: true } },
        },
        orderBy: { inicio: 'asc' },
      },
      eventosDiario: { where: { interno: false }, orderBy: { data: 'desc' }, include: { foto: true } },
      atualizacoes: {
        where: { publica: true },
        orderBy: { criadaEm: 'desc' },
        take: 3,
        include: { foto: true },
      },
      campanhas: { where: { status: 'ATIVA' }, include: { contribuicoes: { where: { status: 'PAGA' } } } },
    },
  });

  if (!animal) return null;

  const [vacinas, castracao, consultas] = await Promise.all([
    db.registroSaude.count({ where: { animalId: animal.id, tipo: 'VACINA' } }),
    db.registroSaude.findFirst({ where: { animalId: animal.id, tipo: 'CASTRACAO' } }),
    db.registroSaude.count({ where: { animalId: animal.id, tipo: 'CONSULTA' } }),
  ]);

  return {
    animal,
    custo: calcularCusto(animal),
    resumoSaude: { vacinas, castrado: animal.castrado || Boolean(castracao), consultas },
    campanhas: animal.campanhas.map((c) => ({
      id: c.id,
      slug: c.slug,
      titulo: c.titulo,
      resumo: c.resumo,
      urgente: c.urgente,
      prazo: c.prazo,
      meta: paraNumero(c.meta),
      arrecadado: c.contribuicoes.reduce((s, x) => s + paraNumero(x.valor), 0),
    })),
  };
}

export async function listarCampanhasPublicas() {
  const campanhas = await db.campanha.findMany({
    where: { status: { in: ['ATIVA', 'CONCLUIDA'] } },
    orderBy: [{ status: 'asc' }, { urgente: 'desc' }, { criadaEm: 'desc' }],
    include: {
      animal: { select: { nome: true, slug: true, fotoCapaId: true } },
      contribuicoes: { where: { status: 'PAGA' }, select: { valor: true } },
    },
  });

  return campanhas.map((c) => ({
    id: c.id,
    slug: c.slug,
    titulo: c.titulo,
    resumo: c.resumo,
    texto: c.texto,
    status: c.status,
    urgente: c.urgente,
    prazo: c.prazo,
    animal: c.animal,
    meta: paraNumero(c.meta),
    arrecadado: c.contribuicoes.reduce((s, x) => s + paraNumero(x.valor), 0),
    doadores: c.contribuicoes.length,
  }));
}

/** Busca simples para o campo do topo da vitrine. */
export function combina(cartao: CartaoAnimal, termo: string): boolean {
  const t = normalizar(termo);
  return normalizar(cartao.nome).includes(t);
}
