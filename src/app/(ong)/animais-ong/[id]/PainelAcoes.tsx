'use client';

import { useActionState, useState } from 'react';
import { publicarAtualizacao, registrarEvento, enviarFoto, type EstadoAnimal } from '../actions';
import { registrarSaude, type EstadoSaude } from '../../saude/actions';
import { Aviso, Cartao } from '@/components/ui';

/**
 * As quatro coisas que a equipe faz no dia a dia, num painel só:
 * contar a novidade ao padrinho, registrar um marco, lançar um
 * atendimento e subir foto.
 *
 * Elas ficam em abas, e não em quatro cartões empilhados, porque o
 * celular é o aparelho real de quem trabalha no abrigo — quatro
 * formulários abertos viram dois metros de rolagem.
 */

const ABAS = [
  { chave: 'atualizacao', rotulo: '📣 Novidade para os padrinhos' },
  { chave: 'saude', rotulo: '🏥 Registro de saúde' },
  { chave: 'evento', rotulo: '🐾 Marco no diário' },
  { chave: 'foto', rotulo: '📸 Foto ou vídeo' },
] as const;

const INICIAL: EstadoAnimal = {};
const INICIAL_SAUDE: EstadoSaude = {};

export function PainelAcoes({
  animalId,
  animalNome,
  padrinhosAtivos,
  veterinarios,
}: {
  animalId: string;
  animalNome: string;
  padrinhosAtivos: number;
  veterinarios: { id: string; nome: string }[];
}) {
  const [aba, setAba] = useState<(typeof ABAS)[number]['chave']>('atualizacao');
  const hoje = new Date().toISOString().slice(0, 10);

  const [estadoAtu, acaoAtu, enviandoAtu] = useActionState(publicarAtualizacao, INICIAL);
  const [estadoSaude, acaoSaude, enviandoSaude] = useActionState(registrarSaude, INICIAL_SAUDE);
  const [estadoEvento, acaoEvento, enviandoEvento] = useActionState(registrarEvento, INICIAL);
  const [estadoFoto, acaoFoto, enviandoFoto] = useActionState(enviarFoto, INICIAL);

  const [tipoSaude, setTipoSaude] = useState('CONSULTA');

  return (
    <Cartao>
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ABAS.map((a) => (
          <button
            key={a.chave}
            type="button"
            onClick={() => setAba(a.chave)}
            aria-pressed={aba === a.chave}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              aba === a.chave
                ? 'border-petroleo-800 bg-petroleo-800 text-white'
                : 'border-tinta-borda bg-white text-tinta-suave hover:border-petroleo-300'
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {aba === 'atualizacao' ? (
          <form action={acaoAtu} className="space-y-3" key="atualizacao">
            <input type="hidden" name="animalId" value={animalId} />
            <p className="text-sm text-tinta-suave">
              {padrinhosAtivos > 0
                ? `${padrinhosAtivos} ${padrinhosAtivos === 1 ? 'padrinho vai' : 'padrinhos vão'} receber esta novidade.`
                : `O ${animalNome} ainda não tem padrinho — a novidade fica guardada para quando tiver.`}
            </p>
            <div>
              <label htmlFor="atu-titulo" className="rotulo">
                Título
              </label>
              <input
                id="atu-titulo"
                name="titulo"
                className="campo"
                required
                placeholder={`O ${animalNome} está bem!`}
              />
            </div>
            <div>
              <label htmlFor="atu-texto" className="rotulo">
                O que aconteceu
              </label>
              <textarea
                id="atu-texto"
                name="texto"
                rows={4}
                className="campo"
                required
                placeholder={`O ${animalNome} ganhou peso e está respondendo bem ao tratamento.`}
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-tinta">
              <input
                type="checkbox"
                name="publica"
                className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
              />
              Mostrar também na página pública do {animalNome}
            </label>
            {estadoAtu.erro ? <Aviso tom="risco">{estadoAtu.erro}</Aviso> : null}
            <button type="submit" className="botao-primario" disabled={enviandoAtu}>
              {enviandoAtu ? 'Enviando...' : 'Enviar novidade'}
            </button>
          </form>
        ) : null}

        {aba === 'saude' ? (
          <form action={acaoSaude} className="space-y-3" key="saude">
            <input type="hidden" name="animalId" value={animalId} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="s-tipo" className="rotulo">
                  Tipo
                </label>
                <select
                  id="s-tipo"
                  name="tipo"
                  className="campo"
                  value={tipoSaude}
                  onChange={(e) => setTipoSaude(e.target.value)}
                >
                  <option value="CONSULTA">Consulta</option>
                  <option value="VACINA">Vacina</option>
                  <option value="VERMIFUGO">Vermífugo</option>
                  <option value="CASTRACAO">Castração</option>
                  <option value="EXAME">Exame</option>
                  <option value="CIRURGIA">Cirurgia</option>
                  <option value="MEDICAMENTO">Medicamento</option>
                  <option value="PESAGEM">Pesagem</option>
                  <option value="ALERGIA">Alergia</option>
                  <option value="DOENCA">Doença</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <div>
                <label htmlFor="s-data" className="rotulo">
                  Data
                </label>
                <input id="s-data" name="data" type="date" className="campo" required defaultValue={hoje} />
              </div>
              <div>
                <label htmlFor="s-valor" className="rotulo">
                  Valor (R$)
                </label>
                <input id="s-valor" name="valor" type="number" step="0.01" min="0" className="campo" />
              </div>
            </div>

            <div>
              <label htmlFor="s-titulo" className="rotulo">
                O que foi feito
              </label>
              <input id="s-titulo" name="titulo" className="campo" required placeholder="Consulta de retorno" />
            </div>

            {tipoSaude === 'PESAGEM' ? (
              <div>
                <label htmlFor="s-peso" className="rotulo">
                  Peso (kg)
                </label>
                <input
                  id="s-peso"
                  name="pesoKg"
                  type="number"
                  step="0.1"
                  min="0"
                  className="campo max-w-[160px]"
                  required
                />
              </div>
            ) : null}

            {tipoSaude === 'MEDICAMENTO' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-med" className="rotulo">
                    Medicamento
                  </label>
                  <input id="s-med" name="medicamento" className="campo" />
                </div>
                <div>
                  <label htmlFor="s-dose" className="rotulo">
                    Dosagem
                  </label>
                  <input id="s-dose" name="dosagem" className="campo" placeholder="1 comprimido a cada 12h" />
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="s-prox" className="rotulo">
                  Próximo retorno
                </label>
                <input id="s-prox" name="proximaData" type="date" className="campo" />
              </div>
              <div>
                <label htmlFor="s-vet" className="rotulo">
                  Veterinário responsável
                </label>
                <select id="s-vet" name="veterinarioId" className="campo" defaultValue="">
                  <option value="">Não informado</option>
                  {veterinarios.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="s-desc" className="rotulo">
                Observações
              </label>
              <textarea id="s-desc" name="descricao" rows={3} className="campo" />
            </div>

            <label className="flex items-center gap-2.5 text-sm text-tinta">
              <input
                type="checkbox"
                name="lancarDespesa"
                defaultChecked
                className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
              />
              Lançar o valor como despesa deste animal
            </label>

            {estadoSaude.erro ? <Aviso tom="risco">{estadoSaude.erro}</Aviso> : null}
            {estadoSaude.ok ? <Aviso tom="sucesso">Registro salvo.</Aviso> : null}
            <button type="submit" className="botao-primario" disabled={enviandoSaude}>
              {enviandoSaude ? 'Salvando...' : 'Registrar'}
            </button>
          </form>
        ) : null}

        {aba === 'evento' ? (
          <form action={acaoEvento} className="space-y-3" key="evento">
            <input type="hidden" name="animalId" value={animalId} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="e-tipo" className="rotulo">
                  Tipo
                </label>
                <select id="e-tipo" name="tipo" className="campo" defaultValue="MELHORA">
                  <option value="MELHORA">❤️ Melhora</option>
                  <option value="PASSEIO">📸 Passeio</option>
                  <option value="TRATAMENTO">💊 Tratamento</option>
                  <option value="CONSULTA">🏥 Consulta</option>
                  <option value="ANIVERSARIO">🎂 Aniversário</option>
                  <option value="OUTRO">📋 Outro</option>
                </select>
              </div>
              <div>
                <label htmlFor="e-data" className="rotulo">
                  Data
                </label>
                <input id="e-data" name="data" type="date" className="campo" required defaultValue={hoje} />
              </div>
            </div>
            <div>
              <label htmlFor="e-titulo" className="rotulo">
                O que aconteceu
              </label>
              <input id="e-titulo" name="titulo" className="campo" required placeholder="Primeira melhora!" />
            </div>
            <div>
              <label htmlFor="e-desc" className="rotulo">
                Detalhe
              </label>
              <textarea id="e-desc" name="descricao" rows={3} className="campo" />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-tinta">
              <input
                type="checkbox"
                name="interno"
                className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
              />
              Registro interno (não aparece na página pública)
            </label>
            {estadoEvento.erro ? <Aviso tom="risco">{estadoEvento.erro}</Aviso> : null}
            <button type="submit" className="botao-primario" disabled={enviandoEvento}>
              {enviandoEvento ? 'Salvando...' : 'Adicionar ao diário'}
            </button>
          </form>
        ) : null}

        {aba === 'foto' ? (
          <form action={acaoFoto} className="space-y-3" key="foto">
            <input type="hidden" name="animalId" value={animalId} />
            <div>
              <label htmlFor="f-arquivo" className="rotulo">
                Arquivo
              </label>
              <input
                id="f-arquivo"
                name="arquivo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                className="campo file:mr-3 file:rounded-lg file:border-0 file:bg-petroleo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-petroleo-700"
                required
              />
              <p className="mt-1 text-xs text-tinta-clara">JPG, PNG, WEBP ou MP4, até 25 MB.</p>
            </div>
            <div>
              <label htmlFor="f-legenda" className="rotulo">
                Legenda
              </label>
              <input id="f-legenda" name="legenda" className="campo" />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-tinta">
              <input
                type="checkbox"
                name="capa"
                className="h-4 w-4 rounded border-tinta-borda text-laranja-500 focus:ring-laranja-400"
              />
              Usar como foto de capa
            </label>
            {estadoFoto.erro ? <Aviso tom="risco">{estadoFoto.erro}</Aviso> : null}
            <button type="submit" className="botao-primario" disabled={enviandoFoto}>
              {enviandoFoto ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        ) : null}
      </div>
    </Cartao>
  );
}
