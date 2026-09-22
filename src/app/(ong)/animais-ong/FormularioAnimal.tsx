'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { atualizarAnimal, criarAnimal, type EstadoAnimal } from './actions';
import { Aviso, Cartao } from '@/components/ui';
import { reais } from '@/lib/format';

const INICIAL: EstadoAnimal = {};

export type ValoresAnimal = {
  id?: string;
  nome?: string;
  especie?: string;
  sexo?: string;
  porte?: string;
  raca?: string | null;
  pelagem?: string | null;
  dataNascimento?: string;
  idadeAproximada?: string | null;
  dataResgate?: string;
  localResgate?: string | null;
  historiaResgate?: string | null;
  personalidade?: string | null;
  castrado?: boolean;
  vacinasEmDia?: boolean;
  necessidadeEspecial?: boolean;
  descricaoNecessidade?: string | null;
  status?: string;
  localAbrigo?: string | null;
  pesoAtualKg?: string;
  custoAlimentacao?: number;
  custoTratamento?: number;
  custoMedicamento?: number;
  destaque?: boolean;
};

export function FormularioAnimal({ valores = {} }: { valores?: ValoresAnimal }) {
  const editando = Boolean(valores.id);
  const [estado, acao, enviando] = useActionState(
    editando ? atualizarAnimal : criarAnimal,
    INICIAL,
  );

  // O total aparece enquanto a pessoa digita: é ele que vai virar a meta
  // pública do animal, e ver a soma crescer evita o custo mensal sair
  // por engano com um zero a mais.
  const [custos, setCustos] = useState({
    alimentacao: valores.custoAlimentacao ?? 0,
    tratamento: valores.custoTratamento ?? 0,
    medicamento: valores.custoMedicamento ?? 0,
  });
  const total = custos.alimentacao + custos.tratamento + custos.medicamento;

  const [especial, setEspecial] = useState(valores.necessidadeEspecial ?? false);

  return (
    <form action={acao} className="space-y-4">
      {valores.id ? <input type="hidden" name="id" value={valores.id} /> : null}

      <Cartao>
        <h2 className="titulo-seccao">Identificação</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="nome" className="rotulo">
              Nome
            </label>
            <input id="nome" name="nome" className="campo" required defaultValue={valores.nome ?? ''} />
          </div>
          <div>
            <label htmlFor="especie" className="rotulo">
              Espécie
            </label>
            <select id="especie" name="especie" className="campo" defaultValue={valores.especie ?? 'CANINA'}>
              <option value="CANINA">Cachorro</option>
              <option value="FELINA">Gato</option>
              <option value="OUTRA">Outro</option>
            </select>
          </div>
          <div>
            <label htmlFor="sexo" className="rotulo">
              Sexo
            </label>
            <select id="sexo" name="sexo" className="campo" defaultValue={valores.sexo ?? 'NAO_INFORMADO'}>
              <option value="MACHO">Macho</option>
              <option value="FEMEA">Fêmea</option>
              <option value="NAO_INFORMADO">Não informado</option>
            </select>
          </div>
          <div>
            <label htmlFor="porte" className="rotulo">
              Porte
            </label>
            <select id="porte" name="porte" className="campo" defaultValue={valores.porte ?? 'MEDIO'}>
              <option value="PEQUENO">Pequeno</option>
              <option value="MEDIO">Médio</option>
              <option value="GRANDE">Grande</option>
            </select>
          </div>
          <div>
            <label htmlFor="raca" className="rotulo">
              Raça
            </label>
            <input id="raca" name="raca" className="campo" defaultValue={valores.raca ?? ''} placeholder="SRD" />
          </div>
          <div>
            <label htmlFor="pelagem" className="rotulo">
              Pelagem
            </label>
            <input id="pelagem" name="pelagem" className="campo" defaultValue={valores.pelagem ?? ''} />
          </div>
          <div>
            <label htmlFor="dataNascimento" className="rotulo">
              Nascimento
            </label>
            <input
              id="dataNascimento"
              name="dataNascimento"
              type="date"
              className="campo"
              defaultValue={valores.dataNascimento ?? ''}
            />
          </div>
          <div>
            <label htmlFor="idadeAproximada" className="rotulo">
              Idade estimada
            </label>
            <input
              id="idadeAproximada"
              name="idadeAproximada"
              className="campo"
              placeholder="4 anos"
              defaultValue={valores.idadeAproximada ?? ''}
            />
            <p className="mt-1 text-xs text-tinta-clara">
              Use quando não houver data de nascimento — o caso normal em resgate.
            </p>
          </div>
        </div>
      </Cartao>

      <Cartao>
        <h2 className="titulo-seccao">Resgate e história</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="dataResgate" className="rotulo">
              Data do resgate
            </label>
            <input
              id="dataResgate"
              name="dataResgate"
              type="date"
              className="campo"
              required
              defaultValue={valores.dataResgate ?? ''}
            />
          </div>
          <div>
            <label htmlFor="localResgate" className="rotulo">
              Onde foi resgatado
            </label>
            <input
              id="localResgate"
              name="localResgate"
              className="campo"
              defaultValue={valores.localResgate ?? ''}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="historiaResgate" className="rotulo">
              A história dele
            </label>
            <textarea
              id="historiaResgate"
              name="historiaResgate"
              rows={5}
              className="campo"
              defaultValue={valores.historiaResgate ?? ''}
              placeholder="Como ele chegou, em que estado, o que mudou desde então."
            />
            <p className="mt-1 text-xs text-tinta-clara">
              Este texto é o que faz alguém parar o scroll e apadrinhar. Escreva como quem conta
              para um amigo, não como quem preenche um cadastro.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="personalidade" className="rotulo">
              Como ele é
            </label>
            <textarea
              id="personalidade"
              name="personalidade"
              rows={3}
              className="campo"
              defaultValue={valores.personalidade ?? ''}
              placeholder="Brincalhão, se dá bem com outros cães, tem medo de barulho..."
            />
          </div>
        </div>
      </Cartao>

      <Cartao>
        <h2 className="titulo-seccao">Situação e saúde</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="status" className="rotulo">
              Status
            </label>
            <select id="status" name="status" className="campo" defaultValue={valores.status ?? 'EM_TRATAMENTO'}>
              <option value="EM_TRATAMENTO">🏥 Em tratamento</option>
              <option value="DISPONIVEL_ADOCAO">🟢 Disponível para adoção</option>
              <option value="EM_PROCESSO_ADOCAO">🟡 Em processo de adoção</option>
              <option value="ADOTADO">🏡 Adotado</option>
              <option value="INDISPONIVEL">🔵 Indisponível</option>
              <option value="FALECIDO">🕊️ Falecido</option>
            </select>
          </div>
          <div>
            <label htmlFor="localAbrigo" className="rotulo">
              Onde está
            </label>
            <input
              id="localAbrigo"
              name="localAbrigo"
              className="campo"
              placeholder="Canil 2 / lar temporário"
              defaultValue={valores.localAbrigo ?? ''}
            />
          </div>
          <div>
            <label htmlFor="pesoAtualKg" className="rotulo">
              Peso atual (kg)
            </label>
            <input
              id="pesoAtualKg"
              name="pesoAtualKg"
              type="number"
              step="0.1"
              min="0"
              className="campo"
              defaultValue={valores.pesoAtualKg ?? ''}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {[
            { nome: 'castrado', rotulo: 'Castrado', marcado: valores.castrado },
            { nome: 'vacinasEmDia', rotulo: 'Vacinas em dia', marcado: valores.vacinasEmDia },
            { nome: 'destaque', rotulo: 'Destacar na vitrine pública', marcado: valores.destaque },
          ].map((c) => (
            <label key={c.nome} className="flex items-center gap-2.5 text-sm text-tinta">
              <input
                type="checkbox"
                name={c.nome}
                defaultChecked={c.marcado}
                className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
              />
              {c.rotulo}
            </label>
          ))}

          <label className="flex items-center gap-2.5 text-sm text-tinta">
            <input
              type="checkbox"
              name="necessidadeEspecial"
              checked={especial}
              onChange={(e) => setEspecial(e.target.checked)}
              className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
            />
            Tem necessidade especial
          </label>

          {especial ? (
            <div>
              <label htmlFor="descricaoNecessidade" className="rotulo">
                Qual o cuidado necessário
              </label>
              <textarea
                id="descricaoNecessidade"
                name="descricaoNecessidade"
                rows={3}
                className="campo"
                defaultValue={valores.descricaoNecessidade ?? ''}
                placeholder="Cego do olho direito, precisa de ração especial, toma medicação contínua..."
              />
            </div>
          ) : null}
        </div>
      </Cartao>

      <Cartao className="border-laranja-200">
        <h2 className="titulo-seccao">Custo mensal estimado</h2>
        <p className="mt-1 text-sm text-tinta-suave">
          É a meta que aparece na página pública. Estimativa da ONG — o gasto real de cada mês vem
          dos lançamentos do financeiro.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { chave: 'alimentacao', nome: 'custoAlimentacao', rotulo: '🍖 Alimentação' },
            { chave: 'tratamento', nome: 'custoTratamento', rotulo: '🏥 Tratamento' },
            { chave: 'medicamento', nome: 'custoMedicamento', rotulo: '💊 Medicamentos' },
          ].map((c) => (
            <div key={c.chave}>
              <label htmlFor={c.nome} className="rotulo">
                {c.rotulo}
              </label>
              <input
                id={c.nome}
                name={c.nome}
                type="number"
                step="5"
                min="0"
                className="campo"
                value={custos[c.chave as keyof typeof custos]}
                onChange={(e) =>
                  setCustos((atual) => ({ ...atual, [c.chave]: Number(e.target.value) || 0 }))
                }
              />
            </div>
          ))}
        </div>

        <p className="mt-3 text-right text-sm font-bold text-petroleo-900">
          Total: <span className="text-xl tabular-nums">{reais(total)}</span> por mês
        </p>
      </Cartao>

      {estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="botao-primario" disabled={enviando}>
          {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar animal'}
        </button>
        <Link
          href={valores.id ? `/animais-ong/${valores.id}` : '/animais-ong'}
          className="botao-secundario"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
