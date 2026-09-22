'use client';

import { useActionState } from 'react';
import { mudarStatusAdocao, type EstadoAdocao } from './actions';

const INICIAL: EstadoAdocao = {};

const PROXIMOS: Record<string, { valor: string; rotulo: string }[]> = {
  INTERESSE: [
    { valor: 'ENTREVISTA', rotulo: 'marcar entrevista' },
    { valor: 'RECUSADA', rotulo: 'recusar' },
  ],
  ENTREVISTA: [
    { valor: 'VISITA', rotulo: 'marcar visita' },
    { valor: 'APROVADA', rotulo: 'aprovar' },
    { valor: 'RECUSADA', rotulo: 'recusar' },
  ],
  VISITA: [
    { valor: 'APROVADA', rotulo: 'aprovar' },
    { valor: 'RECUSADA', rotulo: 'recusar' },
  ],
  APROVADA: [
    { valor: 'CONCLUIDA', rotulo: 'concluir adoção' },
    { valor: 'DESISTENCIA', rotulo: 'desistência' },
  ],
};

/**
 * Só o próximo passo do funil aparece. Um <select> com os sete status
 * deixaria "concluída" a um clique de distância de "interesse" — e
 * concluir uma adoção desativa o animal e fecha a página pública dele.
 */
export function AcoesAdocao({ id, status }: { id: string; status: string }) {
  const [estado, acao, enviando] = useActionState(mudarStatusAdocao, INICIAL);
  const opcoes = PROXIMOS[status] ?? [];

  if (opcoes.length === 0) {
    return <span className="text-xs text-tinta-clara">processo encerrado</span>;
  }

  return (
    <div className="flex flex-wrap justify-end gap-2.5">
      {opcoes.map((o) => (
        <form key={o.valor} action={acao}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={o.valor} />
          <button
            type="submit"
            disabled={enviando}
            title={estado.erro ?? undefined}
            className={`whitespace-nowrap text-xs font-bold hover:underline ${
              o.valor === 'RECUSADA' || o.valor === 'DESISTENCIA'
                ? 'text-tinta-clara hover:text-risco'
                : o.valor === 'CONCLUIDA'
                  ? 'text-emerald-700'
                  : 'text-petroleo-600'
            }`}
          >
            {o.rotulo}
          </button>
        </form>
      ))}
    </div>
  );
}
