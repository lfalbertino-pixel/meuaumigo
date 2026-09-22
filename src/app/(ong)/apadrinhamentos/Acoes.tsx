'use client';

import { useActionState, useState } from 'react';
import { mudarStatus, type EstadoApadrinhamento } from './actions';

const INICIAL: EstadoApadrinhamento = {};

/**
 * Pausar volta com um clique; cancelar abre um campo de motivo antes.
 * A assimetria é de propósito: pausa é reversível, cancelamento encerra
 * o vínculo e encerra as cobranças futuras.
 */
export function AcoesApadrinhamento({ id, status }: { id: string; status: string }) {
  const [estado, acao, enviando] = useActionState(mudarStatus, INICIAL);
  const [cancelando, setCancelando] = useState(false);

  if (status === 'CANCELADO') {
    return (
      <form action={acao} className="flex justify-end">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value="ATIVO" />
        <button type="submit" className="text-xs font-bold text-petroleo-600 hover:underline" disabled={enviando}>
          reativar
        </button>
      </form>
    );
  }

  if (cancelando) {
    return (
      <form action={acao} className="flex flex-col items-end gap-1.5">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value="CANCELADO" />
        <input
          name="motivo"
          className="campo w-full py-1.5 text-xs sm:w-52"
          placeholder="Motivo do cancelamento"
          required
          autoFocus
        />
        {estado.erro ? <span className="text-[11px] text-risco">{estado.erro}</span> : null}
        <span className="flex gap-2">
          <button type="submit" className="text-xs font-bold text-risco hover:underline" disabled={enviando}>
            confirmar
          </button>
          <button
            type="button"
            onClick={() => setCancelando(false)}
            className="text-xs font-bold text-tinta-clara hover:underline"
          >
            voltar
          </button>
        </span>
      </form>
    );
  }

  return (
    <div className="flex justify-end gap-3">
      <form action={acao}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value={status === 'PAUSADO' ? 'ATIVO' : 'PAUSADO'} />
        <button type="submit" className="text-xs font-bold text-petroleo-600 hover:underline" disabled={enviando}>
          {status === 'PAUSADO' ? 'retomar' : 'pausar'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setCancelando(true)}
        className="text-xs font-bold text-tinta-clara hover:text-risco hover:underline"
      >
        cancelar
      </button>
    </div>
  );
}
