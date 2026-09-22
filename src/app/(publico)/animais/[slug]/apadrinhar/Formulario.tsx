'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { apadrinhar, type EstadoApadrinhamento } from './actions';
import { Aviso, Cartao } from '@/components/ui';
import { reais } from '@/lib/format';

/**
 * As modalidades aparecem como cartões, não como <select>.
 *
 * O que está sendo escolhido aqui não é um valor — é o quanto da vida do
 * animal a pessoa vai cobrir. Cada faixa diz o que ela paga; um menu
 * suspenso com "R$ 30, R$ 50, R$ 100" perderia exatamente essa parte.
 */
const MODALIDADES = [
  { valor: 'ALIMENTACAO', preco: 30, titulo: 'Ajude com a alimentação', texto: 'Garante a ração do mês.' },
  { valor: 'CUIDADOS', preco: 50, titulo: 'Alimentação + cuidados', texto: 'Ração, higiene e vermífugo.' },
  { valor: 'COMPLETO', preco: 100, titulo: 'Apadrinhamento completo', texto: 'Alimentação, saúde e medicamentos.' },
  { valor: 'PERSONALIZADO', preco: 0, titulo: 'Valor personalizado', texto: 'Você escolhe quanto pode.' },
] as const;

const INICIAL: EstadoApadrinhamento = { ok: false };

export function FormularioApadrinhamento({
  animalId,
  animalNome,
  animalSlug,
  falta,
  chavePix,
}: {
  animalId: string;
  animalNome: string;
  animalSlug: string;
  falta: number;
  chavePix: string | null;
}) {
  const [estado, acao, enviando] = useActionState(apadrinhar, INICIAL);
  const [modalidade, setModalidade] = useState<string>('COMPLETO');

  if (estado.ok) {
    return (
      <Cartao className="border-emerald-200 bg-emerald-50/60 text-center">
        <p className="text-4xl" aria-hidden>
          ❤️
        </p>
        <h2 className="mt-3 text-2xl font-extrabold text-petroleo-900">
          Obrigado, {estado.padrinho.split(' ')[0]}!
        </h2>
        <p className="mx-auto mt-2 max-w-md text-tinta-suave">
          Seu apadrinhamento do <strong>{estado.animal}</strong> de {reais(estado.valor)} por mês foi
          registrado. Falta só confirmar o primeiro pagamento.
        </p>

        {chavePix ? (
          <div className="mx-auto mt-5 max-w-md rounded-xl border border-emerald-200 bg-white p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-tinta-suave">
              Chave PIX da ONG
            </p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-petroleo-900">
              {chavePix}
            </p>
            <p className="mt-2 text-xs text-tinta-suave">
              Assim que o pagamento cair, a equipe confirma e você passa a receber as novidades do{' '}
              {estado.animal}.
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/animais/${animalSlug}`} className="botao-primario">
            Voltar para o {estado.animal}
          </Link>
          <Link href="/animais" className="botao-secundario">
            Conhecer outros AUmigos
          </Link>
        </div>
      </Cartao>
    );
  }

  return (
    <form action={acao} className="space-y-6">
      <input type="hidden" name="animalId" value={animalId} />

      <fieldset>
        <legend className="titulo-seccao">1. Escolha o seu apadrinhamento</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {MODALIDADES.map((m) => {
            const marcado = modalidade === m.valor;
            return (
              <label
                key={m.valor}
                className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                  marcado
                    ? 'border-laranja-400 bg-laranja-50'
                    : 'border-tinta-borda bg-white hover:border-laranja-200'
                }`}
              >
                <input
                  type="radio"
                  name="modalidade"
                  value={m.valor}
                  checked={marcado}
                  onChange={() => setModalidade(m.valor)}
                  className="sr-only"
                />
                <span className="block text-lg font-extrabold text-petroleo-900">
                  {m.preco > 0 ? `${reais(m.preco)}/mês` : 'Você escolhe'}
                </span>
                <span className="mt-0.5 block text-sm font-semibold text-tinta">{m.titulo}</span>
                <span className="mt-0.5 block text-xs text-tinta-suave">{m.texto}</span>
              </label>
            );
          })}
        </div>

        {modalidade === 'PERSONALIZADO' ? (
          <div className="mt-3">
            <label htmlFor="valorPersonalizado" className="rotulo">
              Quanto você quer contribuir por mês?
            </label>
            <input
              id="valorPersonalizado"
              name="valorPersonalizado"
              type="number"
              min={10}
              step={5}
              defaultValue={falta > 10 ? Math.round(falta) : 30}
              className="campo max-w-[200px]"
              required
            />
            <p className="mt-1 text-xs text-tinta-suave">
              {falta > 0
                ? `Faltam ${reais(falta)} por mês para o ${animalNome} ficar completo.`
                : `O custo do ${animalNome} já está coberto — o excedente vai para quem ainda não tem padrinho.`}
            </p>
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="titulo-seccao">2. Seus dados</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nome" className="rotulo">
              Nome completo
            </label>
            <input id="nome" name="nome" className="campo" required autoComplete="name" />
          </div>
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
            />
          </div>
          <div>
            <label htmlFor="telefone" className="rotulo">
              WhatsApp <span className="font-normal normal-case">(opcional)</span>
            </label>
            <input id="telefone" name="telefone" className="campo" autoComplete="tel" />
          </div>
          <div>
            <label htmlFor="documento" className="rotulo">
              CPF <span className="font-normal normal-case">(para recibo, opcional)</span>
            </label>
            <input id="documento" name="documento" className="campo" />
          </div>
          <div>
            <label htmlFor="cidade" className="rotulo">
              Cidade <span className="font-normal normal-case">(opcional)</span>
            </label>
            <input id="cidade" name="cidade" className="campo" autoComplete="address-level2" />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-2.5">
        <legend className="titulo-seccao">3. Preferências</legend>
        <label className="mt-3 flex items-start gap-2.5 text-sm text-tinta">
          <input
            type="checkbox"
            name="aceitaNotificacao"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
          />
          Quero receber as novidades do {animalNome} por e-mail.
        </label>
        <label className="flex items-start gap-2.5 text-sm text-tinta">
          <input
            type="checkbox"
            name="exibirNoPerfil"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
          />
          Pode mostrar meu nome na página do {animalNome}.
        </label>
      </fieldset>

      {'erro' in estado && estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}

      <button type="submit" className="botao-doar w-full px-8 sm:w-auto" disabled={enviando}>
        {enviando ? 'Registrando...' : `❤️ Confirmar apadrinhamento do ${animalNome}`}
      </button>

      <p className="text-xs leading-relaxed text-tinta-clara">
        O apadrinhamento é mensal e você pode cancelar quando quiser, sem multa. Usamos seus dados
        apenas para emitir recibo e enviar as novidades do animal que você apoia.
      </p>
    </form>
  );
}
