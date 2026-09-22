import { sair } from '@/app/(auth)/entrar/actions';
import { IconeSair } from './Icones';
import { PAPEL } from '@/lib/format';
import type { UsuarioSessao } from '@/lib/auth';
import { RetratoGerado } from './FotoAnimal';

export function BarraUsuario({ usuario }: { usuario: UsuarioSessao }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-tinta-borda bg-white p-2.5">
      <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
        <RetratoGerado nome={usuario.nome} className="h-full w-full" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-petroleo-900">{usuario.nome}</span>
        <span className="block text-xs text-tinta-clara">{PAPEL[usuario.papel]}</span>
      </span>
      <form action={sair}>
        <button
          type="submit"
          className="rounded-lg p-2 text-tinta-clara transition hover:bg-tinta-fundo hover:text-risco"
          title="Sair"
          aria-label="Sair"
        >
          <IconeSair tamanho={18} />
        </button>
      </form>
    </div>
  );
}
