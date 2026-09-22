'use client';

import { useActionState, useState } from 'react';
import { doar, type EstadoDoacao } from './actions';
import { Aviso } from '@/components/ui';
import { reais } from '@/lib/format';

const SUGESTOES = [25, 50, 100, 250];

const INICIAL: EstadoDoacao = { ok: false };

export function FormularioDoacao({
  campanhaId,
  chavePix,
  falta,
}: {
  campanhaId: string;
  chavePix: string | null;
  falta: number;
}) {
  const [estado, acao, enviando] = useActionState(doar, INICIAL);
  const [valor, setValor] = useState<number>(50);

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <p className="text-3xl" aria-hidden>
          ❤️
        </p>
        <p className="mt-2 font-extrabold text-petroleo-900">
          Obrigado! Sua doação de {reais(estado.valor)} foi registrada.
        </p>
        {chavePix ? (
          <div className="mt-3 rounded-lg bg-white p-3 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-tinta-suave">Chave PIX</p>
            <p className="mt-0.5 break-all font-mono text-sm font-semibold text-petroleo-900">
              {chavePix}
            </p>
          </div>
        ) : null}
        <p className="mt-3 text-xs text-tinta-suave">
          Assim que o pagamento for confirmado, ele aparece na barra da campanha.
        </p>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="campanhaId" value={campanhaId} />

      <div>
        <span className="rotulo">Quanto você quer doar?</span>
        <div className="flex flex-wrap gap-2">
          {SUGESTOES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setValor(v)}
              className={`rounded-xl border-2 px-4 py-2 text-sm font-extrabold transition ${
                valor === v
                  ? 'border-laranja-400 bg-laranja-50 text-laranja-800'
                  : 'border-tinta-borda bg-white text-tinta-suave hover:border-laranja-200'
              }`}
            >
              {reais(v, { centavos: false })}
            </button>
          ))}
        </div>
        <input
          type="number"
          name="valor"
          min={5}
          step={5}
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          className="campo mt-2 max-w-[180px]"
          aria-label="Valor da doação"
          required
        />
        {falta > 0 ? (
          <p className="mt-1 text-xs text-tinta-suave">Faltam {reais(falta)} para a meta.</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="nome-doador" className="rotulo">
          Seu nome
        </label>
        <input id="nome-doador" name="nome" className="campo" required autoComplete="name" />
      </div>

      <div>
        <label htmlFor="email-doador" className="rotulo">
          E-mail <span className="font-normal normal-case">(opcional, para o recibo)</span>
        </label>
        <input id="email-doador" name="email" type="email" className="campo" autoComplete="email" />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-tinta">
        <input
          type="checkbox"
          name="anonima"
          className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
        />
        Prefiro doar anonimamente.
      </label>

      {'erro' in estado && estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}

      <button type="submit" className="botao-doar w-full" disabled={enviando}>
        {enviando ? 'Registrando...' : `❤️ Doar ${reais(valor)}`}
      </button>
    </form>
  );
}
