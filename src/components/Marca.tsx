import Image from 'next/image';
import Link from 'next/link';

/**
 * A marca. `compacta` é o ícone sozinho, para a barra do app; a completa
 * traz o lettering, e só aparece no site público e no login, onde ainda
 * é preciso dizer a quem pertence a página.
 */
export function Marca({
  compacta = false,
  href = '/',
  className = '',
}: {
  compacta?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/marca/meuaumigo-icone.png"
        alt=""
        width={44}
        height={44}
        className={compacta ? 'h-9 w-9 object-contain' : 'h-11 w-11 object-contain'}
        priority
      />
      {!compacta ? (
        <span className="leading-none">
          <span className="block text-lg font-extrabold tracking-tight text-petroleo-900">
            Meu<span className="text-laranja-500">AU</span>migo
          </span>
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-tinta-clara">
            Apadrinhe histórias reais
          </span>
        </span>
      ) : (
        <span className="sr-only">Meu AUmigo</span>
      )}
    </Link>
  );
}
