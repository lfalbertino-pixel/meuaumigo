'use client';

import NextLink, { type LinkProps } from 'next/link';
import { useLinkStatus } from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

/**
 * Link com fio de progresso.
 *
 * Numa lista de 90 animais, cada navegação é uma ida ao servidor. Sem
 * sinal nenhum, o toque parece não ter funcionado e a pessoa toca de
 * novo. O fio aparece só depois de 120ms (`useLinkStatus` já espera por
 * isso via CSS abaixo) — navegação rápida não pisca a tela.
 */
function Fio() {
  const { pending } = useLinkStatus();
  return pending ? <span className="barra-rota" aria-hidden /> : null;
}

export default function Link({
  children,
  ...props
}: LinkProps & { children: React.ReactNode; className?: string; title?: string; target?: string }) {
  return (
    <NextLink {...props}>
      {children}
      <Fio />
    </NextLink>
  );
}

/** Reexporta o segmento ativo para quem precisa marcar aba sem usePathname. */
export { useSelectedLayoutSegment };
