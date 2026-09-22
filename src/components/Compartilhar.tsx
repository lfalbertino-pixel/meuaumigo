'use client';

import { useState } from 'react';
import { IconeCompartilhar } from './Icones';

/**
 * Compartilhar o animal.
 *
 * No celular usa a folha nativa do sistema (`navigator.share`), que é o
 * caminho real: a pessoa está no Instagram, abre o link, e manda no
 * grupo da família. No desktop, onde `share` quase nunca existe, copia
 * a mensagem pronta — com o texto, não só a URL, porque link solto no
 * WhatsApp não convence ninguém.
 */
export function BotaoCompartilhar({
  nome,
  url,
  texto,
  className = 'botao-secundario',
}: {
  nome: string;
  url: string;
  texto: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const mensagem = `${texto}\n\n${url}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `Conheça o ${nome}`, text: texto, url });
        return;
      } catch {
        // Cancelar a folha nativa cai aqui. Não é erro: a pessoa desistiu.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sem permissão de área de transferência (http sem TLS, por exemplo):
      // abre o WhatsApp Web com a mensagem já montada.
      window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
    }
  }

  return (
    <button type="button" onClick={compartilhar} className={className}>
      <IconeCompartilhar tamanho={17} />
      {copiado ? 'Mensagem copiada!' : 'Compartilhar'}
    </button>
  );
}
