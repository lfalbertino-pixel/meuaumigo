'use client';

import { useActionState } from 'react';
import {
  alternarUsuario,
  criarUsuario,
  criarVeterinario,
  salvarConfiguracao,
  type EstadoConfig,
} from './actions';
import { Aviso, Cartao } from '@/components/ui';

const INICIAL: EstadoConfig = {};

type Config = {
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  cidade: string | null;
  estado: string | null;
  sobre: string | null;
  chavePix: string | null;
  instagram: string | null;
  frase: string;
};

export function FormularioOng({ config }: { config: Config }) {
  const [estado, acao, enviando] = useActionState(salvarConfiguracao, INICIAL);

  return (
    <Cartao>
      <h2 className="titulo-seccao">Dados da ONG</h2>
      <p className="mt-1 text-sm text-tinta-suave">
        Aparecem no rodapé do site, nos textos de compartilhamento e na tela de confirmação do
        apadrinhamento.
      </p>

      <form action={acao} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="o-nome" className="rotulo">
            Nome da ONG
          </label>
          <input id="o-nome" name="nome" className="campo" required defaultValue={config.nome} />
        </div>
        <div>
          <label htmlFor="o-cnpj" className="rotulo">
            CNPJ
          </label>
          <input id="o-cnpj" name="cnpj" className="campo" defaultValue={config.cnpj ?? ''} />
        </div>
        <div>
          <label htmlFor="o-email" className="rotulo">
            E-mail
          </label>
          <input id="o-email" name="email" type="email" className="campo" defaultValue={config.email ?? ''} />
        </div>
        <div>
          <label htmlFor="o-telefone" className="rotulo">
            Telefone
          </label>
          <input id="o-telefone" name="telefone" className="campo" defaultValue={config.telefone ?? ''} />
        </div>
        <div>
          <label htmlFor="o-whatsapp" className="rotulo">
            WhatsApp
          </label>
          <input id="o-whatsapp" name="whatsapp" className="campo" defaultValue={config.whatsapp ?? ''} />
        </div>
        <div>
          <label htmlFor="o-instagram" className="rotulo">
            Instagram
          </label>
          <input
            id="o-instagram"
            name="instagram"
            className="campo"
            placeholder="@meuaumigo"
            defaultValue={config.instagram ?? ''}
          />
        </div>
        <div>
          <label htmlFor="o-cidade" className="rotulo">
            Cidade
          </label>
          <input id="o-cidade" name="cidade" className="campo" defaultValue={config.cidade ?? ''} />
        </div>
        <div>
          <label htmlFor="o-estado" className="rotulo">
            UF
          </label>
          <input
            id="o-estado"
            name="estado"
            className="campo max-w-[100px]"
            maxLength={2}
            defaultValue={config.estado ?? ''}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="o-pix" className="rotulo">
            Chave PIX
          </label>
          <input id="o-pix" name="chavePix" className="campo" defaultValue={config.chavePix ?? ''} />
          <p className="mt-1 text-xs text-tinta-clara">
            Mostrada a quem acabou de apadrinhar ou doar. Confira com calma: é o campo que recebe
            dinheiro.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="o-frase" className="rotulo">
            Frase da marca
          </label>
          <input id="o-frase" name="frase" className="campo" required defaultValue={config.frase} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="o-sobre" className="rotulo">
            Sobre a ONG
          </label>
          <textarea id="o-sobre" name="sobre" rows={4} className="campo" defaultValue={config.sobre ?? ''} />
        </div>

        <div className="sm:col-span-2">
          {estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}
          {estado.ok ? <Aviso tom="sucesso">{estado.ok}</Aviso> : null}
          <button type="submit" className="botao-primario mt-2" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Cartao>
  );
}

export function FormularioUsuario() {
  const [estado, acao, enviando] = useActionState(criarUsuario, INICIAL);

  return (
    <form action={acao} className="mt-4 grid gap-3 sm:grid-cols-4">
      <div>
        <label htmlFor="u-nome" className="rotulo">
          Nome
        </label>
        <input id="u-nome" name="nome" className="campo" required />
      </div>
      <div>
        <label htmlFor="u-email" className="rotulo">
          E-mail
        </label>
        <input id="u-email" name="email" type="email" className="campo" required autoComplete="off" />
      </div>
      <div>
        <label htmlFor="u-senha" className="rotulo">
          Senha provisória
        </label>
        <input
          id="u-senha"
          name="senha"
          type="password"
          className="campo"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="u-papel" className="rotulo">
          Papel
        </label>
        <select id="u-papel" name="papel" className="campo" defaultValue="EQUIPE">
          <option value="EQUIPE">Equipe</option>
          <option value="VETERINARIO">Veterinário(a)</option>
          <option value="ADMIN">Administração</option>
        </select>
      </div>
      <div className="sm:col-span-4">
        {estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}
        {estado.ok ? <Aviso tom="sucesso">{estado.ok}</Aviso> : null}
        <button type="submit" className="botao-secundario mt-2" disabled={enviando}>
          {enviando ? 'Criando...' : 'Criar acesso'}
        </button>
      </div>
    </form>
  );
}

export function BotaoAlternar({ id, ativo }: { id: string; ativo: boolean }) {
  const [, acao, enviando] = useActionState(alternarUsuario, INICIAL);
  return (
    <form action={acao}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={enviando}
        className={`text-xs font-bold hover:underline ${ativo ? 'text-tinta-clara hover:text-risco' : 'text-emerald-700'}`}
      >
        {ativo ? 'desativar' : 'reativar'}
      </button>
    </form>
  );
}

export function FormularioVeterinario() {
  const [estado, acao, enviando] = useActionState(criarVeterinario, INICIAL);

  return (
    <form action={acao} className="mt-4 grid gap-3 sm:grid-cols-4">
      <div>
        <label htmlFor="v-nome" className="rotulo">
          Nome
        </label>
        <input id="v-nome" name="nome" className="campo" required />
      </div>
      <div>
        <label htmlFor="v-crmv" className="rotulo">
          CRMV
        </label>
        <input id="v-crmv" name="crmv" className="campo" />
      </div>
      <div>
        <label htmlFor="v-clinica" className="rotulo">
          Clínica
        </label>
        <input id="v-clinica" name="clinica" className="campo" />
      </div>
      <div>
        <label htmlFor="v-telefone" className="rotulo">
          Telefone
        </label>
        <input id="v-telefone" name="telefone" className="campo" />
      </div>
      <div className="sm:col-span-4">
        {estado.erro ? <Aviso tom="risco">{estado.erro}</Aviso> : null}
        {estado.ok ? <Aviso tom="sucesso">{estado.ok}</Aviso> : null}
        <button type="submit" className="botao-secundario mt-2" disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Cadastrar veterinário'}
        </button>
      </div>
    </form>
  );
}
