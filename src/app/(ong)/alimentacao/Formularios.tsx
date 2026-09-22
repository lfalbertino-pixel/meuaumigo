'use client';

import { useActionState, useState } from 'react';
import { criarItem, movimentar, type EstadoEstoque } from './actions';
import { Aviso, Cartao } from '@/components/ui';

const INICIAL: EstadoEstoque = {};

export function FormularioMovimento({
  itens,
  animais,
}: {
  itens: { id: string; nome: string; unidade: string }[];
  animais: { id: string; nome: string }[];
}) {
  const [estado, acao, enviando] = useActionState(movimentar, INICIAL);
  const [tipo, setTipo] = useState('ENTRADA');
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <Cartao>
      <h2 className="titulo-seccao">Registrar movimento</h2>
      <form action={acao} className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="m-item" className="rotulo">
              Item
            </label>
            <select id="m-item" name="itemId" className="campo" required defaultValue="">
              <option value="" disabled>
                Escolha
              </option>
              {itens.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="m-tipo" className="rotulo">
              Movimento
            </label>
            <select
              id="m-tipo"
              name="tipo"
              className="campo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="ENTRADA">Entrada (compra/doação)</option>
              <option value="SAIDA">Saída (consumo)</option>
              <option value="PERDA">Perda</option>
              <option value="AJUSTE">Ajuste de inventário</option>
            </select>
          </div>
          <div>
            <label htmlFor="m-qtd" className="rotulo">
              {tipo === 'AJUSTE' ? 'Saldo contado' : 'Quantidade'}
            </label>
            <input
              id="m-qtd"
              name="quantidade"
              type="number"
              step="0.001"
              min="0"
              className="campo"
              required
            />
          </div>
          <div>
            <label htmlFor="m-data" className="rotulo">
              Data
            </label>
            <input id="m-data" name="data" type="date" className="campo" required defaultValue={hoje} />
          </div>
        </div>

        {tipo === 'ENTRADA' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="m-valor" className="rotulo">
                Valor pago (R$)
              </label>
              <input id="m-valor" name="valor" type="number" step="0.01" min="0" className="campo" />
            </div>
            <div>
              <label htmlFor="m-forn" className="rotulo">
                Fornecedor
              </label>
              <input id="m-forn" name="fornecedor" className="campo" />
            </div>
          </div>
        ) : null}

        {tipo === 'SAIDA' ? (
          <div>
            <label htmlFor="m-animal" className="rotulo">
              Animal (opcional)
            </label>
            <select id="m-animal" name="animalId" className="campo sm:max-w-xs" defaultValue="">
              <option value="">Abrigo em geral</option>
              {animais.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="m-obs" className="rotulo">
            Observação
          </label>
          <input id="m-obs" name="observacao" className="campo" />
        </div>

        {tipo === 'ENTRADA' ? (
          <label className="flex items-center gap-2.5 text-sm text-tinta">
            <input
              type="checkbox"
              name="lancarDespesa"
              defaultChecked
              className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
            />
            Lançar também como despesa no financeiro
          </label>
        ) : null}

        {estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}
        {estado.ok ? <Aviso tom="sucesso">{estado.ok}</Aviso> : null}

        <button type="submit" className="botao-primario" disabled={enviando}>
          {enviando ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
    </Cartao>
  );
}

export function FormularioItem() {
  const [estado, acao, enviando] = useActionState(criarItem, INICIAL);

  return (
    <details className="cartao p-5">
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-petroleo-600">
        Cadastrar novo item de estoque
      </summary>
      <form action={acao} className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="i-nome" className="rotulo">
            Nome
          </label>
          <input id="i-nome" name="nome" className="campo" required placeholder="Ração adulto premium" />
        </div>
        <div>
          <label htmlFor="i-tipo" className="rotulo">
            Tipo
          </label>
          <select id="i-tipo" name="tipo" className="campo" defaultValue="RACAO">
            <option value="RACAO">Ração</option>
            <option value="MEDICAMENTO">Medicamento</option>
            <option value="HIGIENE">Higiene</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div>
          <label htmlFor="i-unidade" className="rotulo">
            Unidade
          </label>
          <input id="i-unidade" name="unidade" className="campo" defaultValue="kg" />
        </div>
        <div>
          <label htmlFor="i-minimo" className="rotulo">
            Estoque mínimo
          </label>
          <input id="i-minimo" name="minimo" type="number" step="0.1" min="0" className="campo" defaultValue={0} />
        </div>
        <div className="sm:col-span-4">
          {estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}
          {estado.ok ? <Aviso tom="sucesso">{estado.ok}</Aviso> : null}
          <button type="submit" className="botao-secundario mt-2" disabled={enviando}>
            {enviando ? 'Criando...' : 'Criar item'}
          </button>
        </div>
      </form>
    </details>
  );
}
