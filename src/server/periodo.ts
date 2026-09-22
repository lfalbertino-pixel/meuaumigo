/**
 * Mês de competência. Todo o financeiro fecha por ele, e não pela data de
 * pagamento: quem paga a mensalidade de setembro no dia 3 de outubro pagou
 * setembro. Sempre dia 1, meia-noite, no fuso de São Paulo — que é o fuso
 * em que o container roda (TZ no compose).
 */

export function inicioDoMes(data: Date = new Date()): Date {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

export function fimDoMes(data: Date = new Date()): Date {
  return new Date(data.getFullYear(), data.getMonth() + 1, 1);
}

export function somarMeses(data: Date, meses: number): Date {
  return new Date(data.getFullYear(), data.getMonth() + meses, 1);
}

/** Os N meses até o atual, do mais antigo para o mais novo. Eixo x dos gráficos. */
export function ultimosMeses(quantidade: number, referencia: Date = new Date()): Date[] {
  const base = inicioDoMes(referencia);
  return Array.from({ length: quantidade }, (_, i) => somarMeses(base, i - (quantidade - 1)));
}

export function mesmoMes(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Chave estável para agrupar em Map: "2026-09". */
export function chaveMes(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}
