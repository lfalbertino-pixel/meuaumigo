'use client';

import { useActionState } from 'react';
import { criarCampanha, mudarStatusCampanha, type EstadoCampanha } from './actions';
import { Aviso, Cartao } from '@/components/ui';

const INICIAL: EstadoCampanha = {};

export function FormularioCampanha({ animais }: { animais: { id: string; nome: string }[] }) {
  const [estado, acao, enviando] = useActionState(criarCampanha, INICIAL);

  return (
    <Cartao>
      <h2 className="titulo-seccao">Nova campanha</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        Campanha é para o que não cabe no apadrinhamento mensal: cirurgia, tratamento caro,
        resgate grande. Usar para despesa de rotina desgasta o apelo.
      </p>

      <form action={acao} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="c-titulo" className="rotulo">
              Título
            </label>
            <input id="c-titulo" name="titulo" className="campo" required placeholder="AJUDE O BOLT" />
          </div>
          <div>
            <label htmlFor="c-animal" className="rotulo">
              Animal
            </label>
            <select id="c-animal" name="animalId" className="campo" defaultValue="">
              <option value="">Campanha do abrigo</option>
              {animais.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="c-meta" className="rotulo">
              Meta (R$)
            </label>
            <input id="c-meta" name="meta" type="number" step="50" min="50" className="campo" required />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="c-resumo" className="rotulo">
              Resumo
            </label>
            <input
              id="c-resumo"
              name="resumo"
              className="campo"
              required
              placeholder="O Bolt precisa realizar uma cirurgia de urgência."
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="c-texto" className="rotulo">
              Texto completo
            </label>
            <textarea id="c-texto" name="texto" rows={5} className="campo" />
          </div>
          <div>
            <label htmlFor="c-prazo" className="rotulo">
              Prazo
            </label>
            <input id="c-prazo" name="prazo" type="date" className="campo" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2.5 text-sm text-tinta">
            <input
              type="checkbox"
              name="urgente"
              className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
            />
            Marcar como urgente (aparece em destaque na home)
          </label>
          <label className="flex items-center gap-2.5 text-sm text-tinta">
            <input
              type="checkbox"
              name="publicar"
              defaultChecked
              className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
            />
            Publicar agora
          </label>
        </div>

        {estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}
        {estado.ok ? <Aviso tom="sucesso">{estado.ok}</Aviso> : null}

        <button type="submit" className="botao-primario" disabled={enviando}>
          {enviando ? 'Criando...' : 'Criar campanha'}
        </button>
      </form>
    </Cartao>
  );
}

export function AcoesCampanha({ id, status }: { id: string; status: string }) {
  const [, acao, enviando] = useActionState(mudarStatusCampanha, INICIAL);

  const opcoes =
    status === 'RASCUNHO'
      ? [{ valor: 'ATIVA', rotulo: 'publicar' }]
      : status === 'ATIVA'
        ? [
            { valor: 'CONCLUIDA', rotulo: 'concluir' },
            { valor: 'ENCERRADA', rotulo: 'encerrar' },
          ]
        : [{ valor: 'ATIVA', rotulo: 'reabrir' }];

  return (
    <div className="flex justify-end gap-2.5">
      {opcoes.map((o) => (
        <form key={o.valor} action={acao}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={o.valor} />
          <button
            type="submit"
            disabled={enviando}
            className={`text-xs font-bold hover:underline ${
              o.valor === 'CONCLUIDA' ? 'text-emerald-700' : 'text-petroleo-600'
            }`}
          >
            {o.rotulo}
          </button>
        </form>
      ))}
    </div>
  );
}
