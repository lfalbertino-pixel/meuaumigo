'use client';

import { useActionState } from 'react';
import {
  confirmarPagamento,
  gerarMensalidades,
  lancarDespesa,
  marcarAtrasadas,
  type EstadoFinanceiro,
} from './actions';
import { Aviso, Cartao } from '@/components/ui';

const INICIAL: EstadoFinanceiro = {};

export function BotaoConfirmar({ id }: { id: string }) {
  const [estado, acao, enviando] = useActionState(confirmarPagamento, INICIAL);
  return (
    <form action={acao} className="flex items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="metodo"
        defaultValue="PIX"
        className="rounded-lg border border-tinta-borda bg-white px-2 py-1 text-xs font-semibold"
        aria-label="Forma de pagamento"
      >
        <option value="PIX">PIX</option>
        <option value="TRANSFERENCIA">Transferência</option>
        <option value="CARTAO">Cartão</option>
        <option value="BOLETO">Boleto</option>
        <option value="DINHEIRO">Dinheiro</option>
      </select>
      <button
        type="submit"
        className="whitespace-nowrap text-xs font-bold text-emerald-700 hover:underline"
        disabled={enviando}
        title={estado.erro ?? undefined}
      >
        {enviando ? '...' : 'confirmar'}
      </button>
    </form>
  );
}

/**
 * Os dois botões de rotina do mês. Ficam juntos e com o efeito escrito
 * embaixo, porque "gerar mensalidades" cria cobrança para dezenas de
 * pessoas — não é um botão que alguém deva clicar por curiosidade.
 */
export function RotinaDoMes({ ehAdmin }: { ehAdmin: boolean }) {
  const [estadoGerar, acaoGerar, gerando] = useActionState(gerarMensalidades, INICIAL);
  const [estadoAtraso, acaoAtraso, marcando] = useActionState(marcarAtrasadas, INICIAL);

  if (!ehAdmin) return null;

  return (
    <Cartao className="border-petroleo-200 bg-petroleo-50/50">
      <h2 className="titulo-seccao">Rotina do mês</h2>
      <div className="mt-3 flex flex-wrap gap-3">
        <form action={acaoGerar}>
          <button type="submit" className="botao-primario" disabled={gerando}>
            {gerando ? 'Gerando...' : 'Gerar mensalidades do mês'}
          </button>
        </form>
        <form action={acaoAtraso}>
          <button type="submit" className="botao-secundario" disabled={marcando}>
            {marcando ? 'Marcando...' : 'Marcar vencidas como atrasadas'}
          </button>
        </form>
      </div>
      <p className="mt-2 text-xs text-tinta-suave">
        Gerar cria um lançamento pendente por apadrinhamento ativo, pulando quem já tem o mês
        lançado. Pode ser clicado duas vezes sem duplicar nada.
      </p>
      {estadoGerar.ok ? (
        <div className="mt-3">
          <Aviso tom="sucesso">{estadoGerar.ok}</Aviso>
        </div>
      ) : null}
      {estadoAtraso.ok ? (
        <div className="mt-3">
          <Aviso tom="alerta">{estadoAtraso.ok}</Aviso>
        </div>
      ) : null}
    </Cartao>
  );
}

export function FormularioDespesa({ animais }: { animais: { id: string; nome: string }[] }) {
  const [estado, acao, enviando] = useActionState(lancarDespesa, INICIAL);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <Cartao>
      <h2 className="titulo-seccao">Lançar despesa</h2>
      <form action={acao} className="mt-3 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="d-categoria" className="rotulo">
              Categoria
            </label>
            <select id="d-categoria" name="categoria" className="campo" defaultValue="ALIMENTACAO">
              <option value="VETERINARIO">Veterinário</option>
              <option value="ALIMENTACAO">Alimentação</option>
              <option value="MEDICAMENTO">Medicamentos</option>
              <option value="HIGIENE">Higiene</option>
              <option value="TRANSPORTE">Transporte</option>
              <option value="ESTRUTURA">Estrutura</option>
              <option value="OUTRO">Outros</option>
            </select>
          </div>
          <div>
            <label htmlFor="d-data" className="rotulo">
              Data
            </label>
            <input id="d-data" name="data" type="date" className="campo" required defaultValue={hoje} />
          </div>
          <div>
            <label htmlFor="d-valor" className="rotulo">
              Valor (R$)
            </label>
            <input id="d-valor" name="valor" type="number" step="0.01" min="0" className="campo" required />
          </div>
          <div>
            <label htmlFor="d-animal" className="rotulo">
              Animal
            </label>
            <select id="d-animal" name="animalId" className="campo" defaultValue="">
              <option value="">Abrigo (sem animal específico)</option>
              {animais.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="d-descricao" className="rotulo">
              Descrição
            </label>
            <input
              id="d-descricao"
              name="descricao"
              className="campo"
              required
              placeholder="Ração premium 15 kg"
            />
          </div>
          <div>
            <label htmlFor="d-fornecedor" className="rotulo">
              Fornecedor
            </label>
            <input id="d-fornecedor" name="fornecedor" className="campo" />
          </div>
        </div>

        <details className="rounded-xl border border-tinta-borda p-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-petroleo-600">
            Anexar comprovante
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="c-tipo" className="rotulo">
                Tipo
              </label>
              <select id="c-tipo" name="tipoComprovante" className="campo" defaultValue="RECIBO">
                <option value="NOTA_FISCAL">Nota fiscal</option>
                <option value="RECIBO">Recibo</option>
                <option value="CUPOM">Cupom</option>
                <option value="CONTRATO">Contrato</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label htmlFor="c-titulo" className="rotulo">
                Título
              </label>
              <input id="c-titulo" name="tituloComprovante" className="campo" />
            </div>
            <div>
              <label htmlFor="c-arquivo" className="rotulo">
                Arquivo (PDF ou imagem)
              </label>
              <input
                id="c-arquivo"
                name="comprovante"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="campo file:mr-3 file:rounded-lg file:border-0 file:bg-petroleo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-petroleo-700"
              />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2.5 text-sm text-tinta">
            <input
              type="checkbox"
              name="publicoComprovante"
              defaultChecked
              className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
            />
            Publicar na página de transparência
          </label>
          <p className="mt-1.5 text-xs text-tinta-clara">
            Confira antes de publicar: nota fiscal costuma trazer endereço e documento de
            terceiros.
          </p>
        </details>

        {estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}
        {estado.ok ? <Aviso tom="sucesso">{estado.ok}</Aviso> : null}

        <button type="submit" className="botao-primario" disabled={enviando}>
          {enviando ? 'Lançando...' : 'Lançar despesa'}
        </button>
      </form>
    </Cartao>
  );
}
