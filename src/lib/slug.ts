/**
 * Slug do animal — é o que vai no link compartilhado no WhatsApp
 * (meuaumigo.com.br/animais/thor). Precisa ser curto, legível e estável:
 * quando o link já circulou, mudar o slug quebra a captação.
 */
export function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Acrescenta sufixo numérico enquanto o slug já existir. Dois "Mel" no
 * abrigo é o caso comum, não a exceção.
 */
export function slugUnico(base: string, existentes: Set<string>): string {
  const raiz = gerarSlug(base) || 'aumigo';
  if (!existentes.has(raiz)) return raiz;
  for (let i = 2; i < 999; i++) {
    const tentativa = `${raiz}-${i}`;
    if (!existentes.has(tentativa)) return tentativa;
  }
  return `${raiz}-${Date.now()}`;
}
