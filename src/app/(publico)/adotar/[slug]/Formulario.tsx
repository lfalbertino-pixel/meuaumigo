'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { manifestarInteresse, type EstadoAdocao } from './actions';
import { Aviso } from '@/components/ui';

const INICIAL: EstadoAdocao = { ok: false };

export function FormularioAdocao({
  animalId,
  animalNome,
  animalSlug,
}: {
  animalId: string;
  animalNome: string;
  animalSlug: string;
}) {
  const [estado, acao, enviando] = useActionState(manifestarInteresse, INICIAL);

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-4xl" aria-hidden>
          🏡
        </p>
        <h2 className="mt-3 text-xl font-extrabold text-petroleo-900">
          Recebemos seu interesse pelo {estado.animal}!
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-tinta-suave">
          A adoção aqui tem conversa antes: alguém da equipe vai te procurar para entender a sua
          rotina e contar tudo sobre o {estado.animal}. É assim que a gente garante que ele não
          volte para a rua.
        </p>
        <Link href={`/animais/${animalSlug}`} className="botao-primario mt-5">
          Voltar para o {estado.animal}
        </Link>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="animalId" value={animalId} />

      <div className="grid gap-3 sm:grid-cols-2">
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
          <input id="email" name="email" type="email" className="campo" required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="telefone" className="rotulo">
            WhatsApp
          </label>
          <input id="telefone" name="telefone" className="campo" required autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="cidade" className="rotulo">
            Cidade
          </label>
          <input id="cidade" name="cidade" className="campo" autoComplete="address-level2" />
        </div>
        <div>
          <label htmlFor="moradia" className="rotulo">
            Onde você mora
          </label>
          <select id="moradia" name="moradia" className="campo" required defaultValue="">
            <option value="" disabled>
              Escolha
            </option>
            <option>Casa com quintal fechado</option>
            <option>Casa sem quintal</option>
            <option>Apartamento com tela</option>
            <option>Apartamento sem tela</option>
            <option>Sítio ou chácara</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="temOutrosAnimais" className="rotulo">
          Você já tem outros animais? Quais?
        </label>
        <input
          id="temOutrosAnimais"
          name="temOutrosAnimais"
          className="campo"
          placeholder="Ex.: uma cadela de 6 anos, castrada"
        />
      </div>

      <div>
        <label htmlFor="rotina" className="rotulo">
          Conte um pouco da sua rotina
        </label>
        <textarea
          id="rotina"
          name="rotina"
          rows={4}
          className="campo"
          placeholder={`Quantas horas o ${animalNome} ficaria sozinho? Quem cuida dele quando você viaja?`}
        />
      </div>

      {'erro' in estado && estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}

      <button type="submit" className="botao-doar w-full sm:w-auto" disabled={enviando}>
        {enviando ? 'Enviando...' : `🏡 Quero adotar o ${animalNome}`}
      </button>

      <p className="text-xs leading-relaxed text-tinta-clara">
        Manifestar interesse não garante a adoção. Toda adoção passa por conversa, visita e termo
        assinado — para o bem do animal e para o seu.
      </p>
    </form>
  );
}
