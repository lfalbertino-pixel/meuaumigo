import type {
  CategoriaDespesa,
  Especie,
  MetodoPagamento,
  ModalidadeApadrinhamento,
  PapelUsuario,
  Porte,
  Sexo,
  StatusAdocao,
  StatusAnimal,
  StatusApadrinhamento,
  StatusCampanha,
  StatusContribuicao,
  TipoEventoDiario,
  TipoItemEstoque,
  TipoRegistroSaude,
} from '@prisma/client';

const FUSO = 'America/Sao_Paulo';

// ----------------------------------------------------------
// Dinheiro
// ----------------------------------------------------------

/**
 * Prisma devolve Decimal, os agregados devolvem number e o formulário
 * devolve string. Tudo que fala de dinheiro passa por aqui primeiro —
 * é o único lugar onde essa conversão acontece.
 */
export function paraNumero(valor: unknown): number {
  if (valor === null || valor === undefined) return 0;
  const n = typeof valor === 'object' ? Number(valor.toString()) : Number(valor);
  return Number.isFinite(n) ? n : 0;
}

export function reais(valor: unknown, opcoes?: { centavos?: boolean }): string {
  const n = paraNumero(valor);
  const casas = opcoes?.centavos === false ? 0 : 2;
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Para cartão e título, onde os centavos só poluem: R$ 18.450. */
export function reaisCurto(valor: unknown): string {
  return reais(valor, { centavos: false });
}

export function numero(valor: unknown): string {
  return paraNumero(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

export function porcento(valor: number): string {
  return `${Math.round(valor)}%`;
}

// ----------------------------------------------------------
// Datas
// ----------------------------------------------------------

export function formatarData(data?: Date | string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: FUSO });
}

export function formatarDataCurta(data?: Date | string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR', {
    timeZone: FUSO,
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatarDataHora(data?: Date | string | null): string {
  if (!data) return '—';
  return new Date(data).toLocaleString('pt-BR', {
    timeZone: FUSO,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatarMesAno(data: Date | string): string {
  return new Date(data).toLocaleDateString('pt-BR', {
    timeZone: FUSO,
    month: 'long',
    year: 'numeric',
  });
}

/** Rótulo de eixo de gráfico: "set", "out". Curto de propósito. */
export function mesCurto(data: Date | string): string {
  return new Date(data)
    .toLocaleDateString('pt-BR', { timeZone: FUSO, month: 'short' })
    .replace('.', '');
}

/** Para <input type="date">. */
export function paraInputData(data?: Date | string | null): string {
  if (!data) return '';
  return new Date(data).toISOString().slice(0, 10);
}

/**
 * "há 14 meses" — o número que sustenta o tempo de amizade do padrinho.
 * Devolve meses inteiros; abaixo de um mês, dias.
 */
export function tempoDesde(data: Date | string): string {
  const inicio = new Date(data);
  const agora = new Date();
  const dias = Math.floor((agora.getTime() - inicio.getTime()) / 86_400_000);
  if (dias < 1) return 'hoje';
  if (dias < 31) return `${dias} ${dias === 1 ? 'dia' : 'dias'}`;

  const meses = mesesEntre(inicio, agora);
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;

  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (resto === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`;
}

export function mesesEntre(inicio: Date, fim: Date): number {
  let meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth());
  if (fim.getDate() < inicio.getDate()) meses--;
  return Math.max(0, meses);
}

// ----------------------------------------------------------
// Idade
// ----------------------------------------------------------

export function idadeEmMeses(dataNascimento?: Date | string | null): number | null {
  if (!dataNascimento) return null;
  return mesesEntre(new Date(dataNascimento), new Date());
}

/**
 * Idade legível. Sem data de nascimento — o caso normal em resgate — cai
 * para o que a equipe estimou, e diz que é estimativa. O perfil público
 * não pode sugerir precisão que não existe.
 */
export function formatarIdade(
  dataNascimento?: Date | string | null,
  idadeAproximada?: string | null,
): string {
  const meses = idadeEmMeses(dataNascimento);
  if (meses === null) return idadeAproximada ? `${idadeAproximada} (aprox.)` : 'idade indefinida';

  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (anos === 0) return `${resto} ${resto === 1 ? 'mês' : 'meses'}`;
  if (resto === 0) return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`;
}

export type FaixaEtaria = 'FILHOTE' | 'ADULTO' | 'IDOSO';

/**
 * Filhote até 12 meses; idoso a partir de 8 anos (7 para porte grande,
 * que envelhece antes). Sem data de nascimento, tenta ler a estimativa
 * escrita à mão — "2 anos", "8 meses" — e desiste em silêncio se não der.
 */
export function faixaEtaria(animal: {
  dataNascimento?: Date | string | null;
  idadeAproximada?: string | null;
  porte?: Porte | null;
}): FaixaEtaria | null {
  const meses = idadeEmMeses(animal.dataNascimento) ?? mesesDaEstimativa(animal.idadeAproximada);
  if (meses === null) return null;
  if (meses < 12) return 'FILHOTE';
  const limiteIdoso = animal.porte === 'GRANDE' ? 7 * 12 : 8 * 12;
  return meses >= limiteIdoso ? 'IDOSO' : 'ADULTO';
}

function mesesDaEstimativa(texto?: string | null): number | null {
  if (!texto) return null;
  const n = Number(texto.match(/\d+/)?.[0]);
  if (!Number.isFinite(n)) return null;
  return /m[eê]s/i.test(texto) ? n : n * 12;
}

export function formatarPeso(peso?: unknown): string {
  if (peso === null || peso === undefined) return '—';
  const n = paraNumero(peso);
  if (n === 0) return '—';
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
}

// ----------------------------------------------------------
// Rótulos dos enums
// ----------------------------------------------------------

export const ESPECIE: Record<Especie, string> = {
  CANINA: 'Cachorro',
  FELINA: 'Gato',
  OUTRA: 'Outro',
};

export const SEXO: Record<Sexo, string> = {
  MACHO: 'Macho',
  FEMEA: 'Fêmea',
  NAO_INFORMADO: 'Não informado',
};

export const PORTE: Record<Porte, string> = {
  PEQUENO: 'Porte pequeno',
  MEDIO: 'Porte médio',
  GRANDE: 'Porte grande',
};

export const FAIXA_ETARIA: Record<FaixaEtaria, string> = {
  FILHOTE: 'Filhote',
  ADULTO: 'Adulto',
  IDOSO: 'Idoso',
};

/**
 * Status do animal. `cor` é a classe do selo; `ponto` é o emoji que a
 * equipe já usa no grupo do WhatsApp — manter o mesmo vocabulário evita
 * um treinamento inteiro.
 */
export const STATUS_ANIMAL: Record<StatusAnimal, { rotulo: string; classe: string; ponto: string }> = {
  EM_TRATAMENTO: {
    rotulo: 'Em tratamento',
    classe: 'bg-laranja-100 text-laranja-800',
    ponto: '🏥',
  },
  DISPONIVEL_ADOCAO: {
    rotulo: 'Disponível para adoção',
    classe: 'bg-emerald-100 text-emerald-800',
    ponto: '🟢',
  },
  EM_PROCESSO_ADOCAO: {
    rotulo: 'Em processo de adoção',
    classe: 'bg-amber-100 text-amber-800',
    ponto: '🟡',
  },
  ADOTADO: { rotulo: 'Adotado', classe: 'bg-petroleo-100 text-petroleo-800', ponto: '🏡' },
  INDISPONIVEL: { rotulo: 'Indisponível', classe: 'bg-tinta-borda text-tinta-suave', ponto: '🔵' },
  FALECIDO: { rotulo: 'Falecido', classe: 'bg-tinta-borda text-tinta-suave', ponto: '🕊️' },
};

export const MODALIDADE: Record<ModalidadeApadrinhamento, string> = {
  ALIMENTACAO: 'Alimentação',
  CUIDADOS: 'Alimentação + cuidados',
  COMPLETO: 'Apadrinhamento completo',
  PERSONALIZADO: 'Valor personalizado',
};

export const STATUS_APADRINHAMENTO: Record<StatusApadrinhamento, { rotulo: string; classe: string }> = {
  ATIVO: { rotulo: 'Ativo', classe: 'bg-emerald-100 text-emerald-800' },
  PAUSADO: { rotulo: 'Pausado', classe: 'bg-amber-100 text-amber-800' },
  CANCELADO: { rotulo: 'Cancelado', classe: 'bg-tinta-borda text-tinta-suave' },
};

export const STATUS_CONTRIBUICAO: Record<StatusContribuicao, { rotulo: string; classe: string }> = {
  PAGA: { rotulo: 'Paga', classe: 'bg-emerald-100 text-emerald-800' },
  PENDENTE: { rotulo: 'Pendente', classe: 'bg-amber-100 text-amber-800' },
  ATRASADA: { rotulo: 'Atrasada', classe: 'bg-rose-100 text-rose-800' },
  CANCELADA: { rotulo: 'Cancelada', classe: 'bg-tinta-borda text-tinta-suave' },
};

export const METODO: Record<MetodoPagamento, string> = {
  PIX: 'PIX',
  CARTAO: 'Cartão',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
  DINHEIRO: 'Dinheiro',
  OUTRO: 'Outro',
};

export const CATEGORIA_DESPESA: Record<CategoriaDespesa, string> = {
  VETERINARIO: 'Veterinário',
  ALIMENTACAO: 'Alimentação',
  MEDICAMENTO: 'Medicamentos',
  HIGIENE: 'Higiene',
  TRANSPORTE: 'Transporte',
  ESTRUTURA: 'Estrutura',
  OUTRO: 'Outros',
};

export const TIPO_SAUDE: Record<TipoRegistroSaude, string> = {
  CONSULTA: 'Consulta',
  VACINA: 'Vacina',
  VERMIFUGO: 'Vermífugo',
  CASTRACAO: 'Castração',
  EXAME: 'Exame',
  CIRURGIA: 'Cirurgia',
  MEDICAMENTO: 'Medicamento',
  PESAGEM: 'Pesagem',
  ALERGIA: 'Alergia',
  DOENCA: 'Doença',
  OUTRO: 'Outro',
};

export const EVENTO_DIARIO: Record<TipoEventoDiario, { rotulo: string; emoji: string }> = {
  RESGATE: { rotulo: 'Resgate', emoji: '🐾' },
  CONSULTA: { rotulo: 'Consulta', emoji: '🏥' },
  TRATAMENTO: { rotulo: 'Tratamento', emoji: '💊' },
  MELHORA: { rotulo: 'Melhora', emoji: '❤️' },
  PASSEIO: { rotulo: 'Passeio', emoji: '📸' },
  APADRINHAMENTO: { rotulo: 'Apadrinhamento', emoji: '🎉' },
  VACINA: { rotulo: 'Vacina', emoji: '💉' },
  CASTRACAO: { rotulo: 'Castração', emoji: '✂️' },
  ADOCAO: { rotulo: 'Adoção', emoji: '🏡' },
  ANIVERSARIO: { rotulo: 'Aniversário', emoji: '🎂' },
  OUTRO: { rotulo: 'Registro', emoji: '📋' },
};

export const STATUS_CAMPANHA: Record<StatusCampanha, { rotulo: string; classe: string }> = {
  RASCUNHO: { rotulo: 'Rascunho', classe: 'bg-tinta-borda text-tinta-suave' },
  ATIVA: { rotulo: 'Ativa', classe: 'bg-emerald-100 text-emerald-800' },
  CONCLUIDA: { rotulo: 'Meta atingida', classe: 'bg-petroleo-100 text-petroleo-800' },
  ENCERRADA: { rotulo: 'Encerrada', classe: 'bg-tinta-borda text-tinta-suave' },
};

export const STATUS_ADOCAO: Record<StatusAdocao, { rotulo: string; classe: string }> = {
  INTERESSE: { rotulo: 'Interesse', classe: 'bg-tinta-borda text-tinta-suave' },
  ENTREVISTA: { rotulo: 'Entrevista', classe: 'bg-amber-100 text-amber-800' },
  VISITA: { rotulo: 'Visita marcada', classe: 'bg-amber-100 text-amber-800' },
  APROVADA: { rotulo: 'Aprovada', classe: 'bg-emerald-100 text-emerald-800' },
  CONCLUIDA: { rotulo: 'Concluída', classe: 'bg-petroleo-100 text-petroleo-800' },
  RECUSADA: { rotulo: 'Recusada', classe: 'bg-rose-100 text-rose-800' },
  DESISTENCIA: { rotulo: 'Desistência', classe: 'bg-tinta-borda text-tinta-suave' },
};

export const TIPO_ITEM: Record<TipoItemEstoque, string> = {
  RACAO: 'Ração',
  MEDICAMENTO: 'Medicamento',
  HIGIENE: 'Higiene',
  OUTRO: 'Outro',
};

export const PAPEL: Record<PapelUsuario, string> = {
  ADMIN: 'Administração',
  EQUIPE: 'Equipe',
  VETERINARIO: 'Veterinário(a)',
  PADRINHO: 'Padrinho',
};

/** Normaliza texto para busca: sem acento, sem caixa. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}
