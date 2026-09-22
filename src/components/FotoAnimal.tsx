/**
 * A foto do animal — ou, enquanto ela não existe, um retrato gerado.
 *
 * O placeholder não é um cinza com ícone: a vitrine pública é a captação
 * da ONG, e um cartão vazio no meio de uma grade mata a fileira inteira.
 * A cor sai do nome, então o mesmo animal tem sempre o mesmo retrato, e
 * dois animais lado a lado quase nunca repetem.
 */

const TONS = [
  ['#0f4a4b', '#1f6362'],
  ['#a85a0d', '#ed9216'],
  ['#1a4f50', '#2e7d79'],
  ['#874712', '#d1780c'],
  ['#143d3f', '#519a96'],
  ['#6f3b12', '#f9a62c'],
];

function semente(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
}

export function RetratoGerado({ nome, className = '' }: { nome: string; className?: string }) {
  const s = semente(nome);
  const [escuro, claro] = TONS[s % TONS.length];
  const inicial = nome.trim().charAt(0).toUpperCase() || '?';
  // Deslocamento da patinha do fundo, para que dois cartões vizinhos não
  // fiquem idênticos mesmo caindo no mesmo par de cores.
  const dx = (s >> 3) % 24;
  const dy = (s >> 7) % 18;

  return (
    <svg viewBox="0 0 160 160" className={className} role="img" aria-label={`Retrato ilustrado de ${nome}`}>
      <defs>
        <linearGradient id={`g${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={claro} />
          <stop offset="100%" stopColor={escuro} />
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill={`url(#g${s})`} />
      <g fill="#fff" opacity="0.13" transform={`translate(${74 + dx} ${58 + dy}) rotate(-12)`}>
        <ellipse cx="0" cy="20" rx="13" ry="16" />
        <ellipse cx="-26" cy="4" rx="9" ry="12" />
        <ellipse cx="-12" cy="-14" rx="9" ry="12" />
        <ellipse cx="12" cy="-14" rx="9" ry="12" />
        <ellipse cx="26" cy="4" rx="9" ry="12" />
      </g>
      <text
        x="80"
        y="80"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize="62"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        opacity="0.92"
      >
        {inicial}
      </text>
    </svg>
  );
}

export function FotoAnimal({
  fotoId,
  nome,
  className = '',
  prioridade = false,
}: {
  fotoId?: string | null;
  nome: string;
  className?: string;
  prioridade?: boolean;
}) {
  if (!fotoId) return <RetratoGerado nome={nome} className={className} />;
  return (
    // <img> puro, e não next/image: a foto já vem do nosso próprio
    // endpoint, com cache imutável, e o otimizador está desligado.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/foto/${fotoId}`}
      alt={`Foto de ${nome}`}
      className={className}
      loading={prioridade ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
