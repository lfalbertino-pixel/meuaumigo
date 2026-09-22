/**
 * Paleta dos gráficos.
 *
 * Fica fora de `Graficos.tsx` de propósito: aquele arquivo é `'use
 * client'`, e tudo que ele exporta vira referência de cliente. A página
 * do painel é servidora e precisa chamar `corDaCategoria` durante o
 * render — o que falha com "attempted to call from the server". Cor é
 * dado, não componente; o lugar dela é aqui.
 *
 * Os quatro tons categóricos passaram pelo validador de contraste e de
 * daltonismo: ΔE de par adjacente acima de 13 em deuteranopia e acima de
 * 22 em visão normal, contra a superfície clara. O laranja e o verde
 * ficam abaixo de 3:1 de contraste com o branco, e é por isso que todo
 * gráfico do sistema traz legenda em texto e tabela equivalente — cor
 * nunca é a única forma de ler um número aqui.
 */

export const CORES = {
  entrada: '#e8860a',
  saida: '#008a7c',
  serie: ['#008a7c', '#e8860a', '#c33a6b', '#79a017'] as const,
  neutro: '#8c9895',
  grade: '#e2eae8',
};

const CORES_CATEGORIA: Record<string, string> = {
  VETERINARIO: '#008a7c',
  ALIMENTACAO: '#e8860a',
  MEDICAMENTO: '#c33a6b',
  HIGIENE: '#79a017',
  TRANSPORTE: '#1a4f50',
  ESTRUTURA: '#a85a0d',
  OUTRO: '#8c9895',
};

export function corDaCategoria(categoria: string): string {
  return CORES_CATEGORIA[categoria] ?? CORES.neutro;
}
