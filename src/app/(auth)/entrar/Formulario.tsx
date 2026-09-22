'use client';

import { useActionState } from 'react';
import { entrar, type EstadoLogin } from './actions';
import { Aviso } from '@/components/ui';

const INICIAL: EstadoLogin = {};

export function FormularioLogin() {
  const [estado, acao, enviando] = useActionState(entrar, INICIAL);

  return (
    <form action={acao} className="cartao space-y-4 p-6">
      <div>
        <label htmlFor="email" className="rotulo">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="campo"
          required
          autoComplete="email"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="senha" className="rotulo">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          className="campo"
          required
          autoComplete="current-password"
        />
      </div>

      {estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}

      <button type="submit" className="botao-primario w-full" disabled={enviando}>
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
