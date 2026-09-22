import { mesesEntre } from '@/lib/format';

/**
 * Reconhecimento, não competição. Não há ranking, ponto nem comparação
 * entre padrinhos — a causa não é um jogo. O que existe é lembrar à
 * pessoa há quanto tempo ela sustenta aquele animal, porque é isso que
 * segura o apadrinhamento no décimo terceiro mês.
 *
 * Tudo aqui é DERIVADO dos apadrinhamentos. Nada é gravado: conquista
 * armazenada é conquista que fica errada quando o dado muda.
 */

export type Conquista = {
  codigo: string;
  titulo: string;
  descricao: string;
  emoji: string;
  conquistada: boolean;
  /** 0–100, para as que ainda estão em andamento. */
  progresso: number;
};

export type DadosConquista = {
  /** Meses do apadrinhamento mais antigo ainda ativo (ou já encerrado). */
  mesesMaisAntigo: number;
  animaisApoiados: number;
  animaisAtivos: number;
  mesesPagos: number;
  apoiouCampanha: boolean;
};

export function calcularConquistas(d: DadosConquista): Conquista[] {
  const marco = (meses: number, titulo: string, emoji: string, descricao: string): Conquista => ({
    codigo: `tempo-${meses}`,
    titulo,
    emoji,
    descricao,
    conquistada: d.mesesMaisAntigo >= meses,
    progresso: Math.min(100, (d.mesesMaisAntigo / meses) * 100),
  });

  return [
    {
      codigo: 'primeiro',
      titulo: 'Primeiro AUmigo',
      emoji: '🐾',
      descricao: 'Você apadrinhou seu primeiro animal.',
      conquistada: d.animaisApoiados >= 1,
      progresso: d.animaisApoiados >= 1 ? 100 : 0,
    },
    marco(6, '6 meses de apadrinhamento', '❤️', 'Meio ano cuidando da mesma história.'),
    marco(12, '1 ano de amizade', '🏆', 'Um ano inteiro ao lado do mesmo AUmigo.'),
    {
      codigo: 'varios',
      titulo: 'AUmigo de vários animais',
      emoji: '🌟',
      descricao: 'Você apadrinha dois ou mais animais ao mesmo tempo.',
      conquistada: d.animaisAtivos >= 2,
      progresso: Math.min(100, (d.animaisAtivos / 2) * 100),
    },
    {
      codigo: 'campanha',
      titulo: 'Presente na emergência',
      emoji: '🚨',
      descricao: 'Você ajudou numa campanha de emergência.',
      conquistada: d.apoiouCampanha,
      progresso: d.apoiouCampanha ? 100 : 0,
    },
  ];
}

/** "João é AUmigo do Thor há 14 meses" — o número, só. */
export function tempoDeAmizade(inicio: Date): number {
  return mesesEntre(new Date(inicio), new Date());
}
