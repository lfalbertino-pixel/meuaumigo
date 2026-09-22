/**
 * Ícones desenhados à mão, em traço de 1.8 — o mesmo peso do texto em
 * negrito ao lado deles. Nenhuma biblioteca: são vinte ícones, e um
 * pacote de mil traria mil.
 */
export type IconeProps = { tamanho?: number; className?: string };

function base(tamanho: number, className?: string) {
  return {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };
}

export function IconePata({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <ellipse cx="6.5" cy="10" rx="2" ry="2.6" />
      <ellipse cx="10.5" cy="6.5" rx="2" ry="2.7" />
      <ellipse cx="15" cy="6.8" rx="2" ry="2.7" />
      <ellipse cx="18.6" cy="10.6" rx="2" ry="2.5" />
      <path d="M12.4 12.2c2.5 0 4.6 1.8 4.6 4.2 0 1.9-1.4 3.1-3.2 3.1-1 0-1.4-.4-2.4-.4s-1.4.4-2.4.4c-1.8 0-3.2-1.2-3.2-3.1 0-2.4 2.1-4.2 4.6-4.2Z" />
    </svg>
  );
}

export function IconeCasa({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M5.5 9.8V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.8" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function IconeCoracao({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M12 20s-7.2-4.3-8.8-8.6C2 8.1 3.9 5.2 6.9 5.2c1.9 0 3.4 1 4.1 2.2h2c.7-1.2 2.2-2.2 4.1-2.2 3 0 4.9 2.9 3.7 6.2C19.2 15.7 12 20 12 20Z" />
    </svg>
  );
}

export function IconeCoracaoCheio({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)} fill="currentColor" stroke="none">
      <path d="M12 20.4S3.9 15.5 2.6 11c-1-3.5 1.1-6.3 4.3-6.3 2 0 3.6 1 4.4 2.3h1.4c.8-1.3 2.4-2.3 4.4-2.3 3.2 0 5.3 2.8 4.3 6.3-1.3 4.5-9.4 9.4-9.4 9.4Z" />
    </svg>
  );
}

export function IconeGente({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19.5c.4-3.2 3-5.3 6.2-5.3s5.8 2.1 6.2 5.3" />
      <path d="M16.2 5.3a3.2 3.2 0 0 1 0 6.1" />
      <path d="M17.4 14.6c2.1.5 3.6 2.3 3.9 4.6" />
    </svg>
  );
}

export function IconeSaude({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <rect x="3.2" y="6.4" width="17.6" height="13.4" rx="2.2" />
      <path d="M9 6.4V5a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 5v1.4" />
      <path d="M12 10.6v5.6M9.2 13.4h5.6" />
    </svg>
  );
}

export function IconeRacao({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M4.6 10.4h14.8l-1.2 8.1a2 2 0 0 1-2 1.7H7.8a2 2 0 0 1-2-1.7L4.6 10.4Z" />
      <path d="M7.6 10.4c0-3 2-5.2 4.4-5.2s4.4 2.2 4.4 5.2" />
      <path d="M10 14.2h4" />
    </svg>
  );
}

export function IconeDinheiro({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <rect x="2.6" y="5.8" width="18.8" height="12.4" rx="2.2" />
      <circle cx="12" cy="12" r="2.8" />
      <path d="M6 9.4v5.2M18 9.4v5.2" />
    </svg>
  );
}

export function IconeMegafone({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M4 10.2v3.6a1.6 1.6 0 0 0 1.6 1.6h1.8L14 19.4V4.6L7.4 8.6H5.6A1.6 1.6 0 0 0 4 10.2Z" />
      <path d="M17.4 9a4.3 4.3 0 0 1 0 6" />
      <path d="M7.4 15.4v3.1a1.4 1.4 0 0 0 2.8 0v-1.8" />
    </svg>
  );
}

export function IconeGrafico({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M4 4v15.2a.8.8 0 0 0 .8.8H20" />
      <path d="M7.8 16V11M11.8 16V7.4M15.8 16v-6.2M19.6 16v-3" />
    </svg>
  );
}

export function IconeIA({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M12 3.4l1.7 3.9 3.9 1.7-3.9 1.7L12 14.6l-1.7-3.9L6.4 9l3.9-1.7L12 3.4Z" />
      <path d="M18.4 14.6l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z" />
      <path d="M5.6 13.4l.6 1.4 1.4.6-1.4.6-.6 1.4L5 16l-1.4-.6L5 14.8l.6-1.4Z" />
    </svg>
  );
}

export function IconeAjustes({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.2a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.2a1.8 1.8 0 0 1-3.6 0v-.1a1.5 1.5 0 0 0-2.7-1.1l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1.1-2.6h-.2a1.8 1.8 0 0 1 0-3.6h.1a1.5 1.5 0 0 0 1.1-2.7l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4v-.2a1.8 1.8 0 0 1 3.6 0v.1a1.5 1.5 0 0 0 2.6 1.1l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0 1.1 2.6h.2a1.8 1.8 0 0 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9Z" />
    </svg>
  );
}

export function IconeMais({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M12 5.4v13.2M5.4 12h13.2" />
    </svg>
  );
}

export function IconeSeta({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M5 12h13.4M13 6.6l5.4 5.4-5.4 5.4" />
    </svg>
  );
}

export function IconeVoltar({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M19 12H5.6M11 6.6 5.6 12 11 17.4" />
    </svg>
  );
}

export function IconeBusca({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <circle cx="10.8" cy="10.8" r="6.2" />
      <path d="m15.4 15.4 4 4" />
    </svg>
  );
}

export function IconeSino({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M6.4 10.2a5.6 5.6 0 0 1 11.2 0c0 4 1.4 5.4 1.4 5.4H5s1.4-1.4 1.4-5.4Z" />
      <path d="M10.2 18.6a2 2 0 0 0 3.6 0" />
    </svg>
  );
}

export function IconeCompartilhar({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <circle cx="17.6" cy="6.2" r="2.6" />
      <circle cx="6.4" cy="12" r="2.6" />
      <circle cx="17.6" cy="17.8" r="2.6" />
      <path d="m8.7 10.8 6.6-3.4M8.7 13.2l6.6 3.4" />
    </svg>
  );
}

export function IconeDocumento({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M13.4 3.4H7a1.8 1.8 0 0 0-1.8 1.8v13.6A1.8 1.8 0 0 0 7 20.6h10a1.8 1.8 0 0 0 1.8-1.8V8.8l-5.4-5.4Z" />
      <path d="M13.4 3.4v5.4h5.4M8.6 13h6.8M8.6 16.4h4.6" />
    </svg>
  );
}

export function IconeSair({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M9.4 20.4H6a1.8 1.8 0 0 1-1.8-1.8V5.4A1.8 1.8 0 0 1 6 3.6h3.4" />
      <path d="M15.4 16.4 19.8 12l-4.4-4.4M19.8 12H9.4" />
    </svg>
  );
}

export function IconeCasaAdocao({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M3.6 11 12 4.4 20.4 11" />
      <path d="M5.6 10.3v8.3a1 1 0 0 0 1 1h10.8a1 1 0 0 0 1-1v-8.3" />
      <path d="M12 17.2s-2.8-1.7-2.8-3.4c0-.9.7-1.6 1.6-1.6.5 0 1 .3 1.2.7.2-.4.7-.7 1.2-.7.9 0 1.6.7 1.6 1.6 0 1.7-2.8 3.4-2.8 3.4Z" />
    </svg>
  );
}

export function IconeRelogio({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3 1.8" />
    </svg>
  );
}

export function IconeAlerta({ tamanho = 20, className }: IconeProps) {
  return (
    <svg {...base(tamanho, className)}>
      <path d="M12 4.6 21 19.4H3L12 4.6Z" />
      <path d="M12 10v3.6M12 16.4h.01" />
    </svg>
  );
}
