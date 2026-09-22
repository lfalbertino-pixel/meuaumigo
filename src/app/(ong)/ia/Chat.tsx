'use client';

import { useRef, useState } from 'react';
import { Aviso, Cartao } from '@/components/ui';
import { IconeIA } from '@/components/Icones';

type Mensagem = { papel: 'usuario' | 'assistente'; texto: string };

/**
 * Os atalhos existem porque a pergunta certa é metade do resultado.
 * Quem trabalha no abrigo não tem que aprender a conversar com modelo —
 * clica no que precisa e edita o texto que volta.
 */
const ATALHOS = [
  'Quais animais estão com maior custo de tratamento este mês?',
  'Quais animais ainda não têm nenhum padrinho? Liste por tempo de abrigo.',
  'Escreva uma atualização curta para os padrinhos sobre o animal com maior despesa do mês.',
  'Analise as despesas deste mês e aponte qualquer aumento fora do normal.',
  'Escreva um post de Instagram convidando para apadrinhar quem está há mais tempo sem padrinho.',
  'Monte uma prestação de contas do mês em tópicos, para enviar aos padrinhos.',
];

export function ChatIA({ disponivel }: { disponivel: boolean }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [rascunho, setRascunho] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  async function enviar(texto: string) {
    const limpo = texto.trim();
    if (!limpo || carregando) return;

    const novas: Mensagem[] = [...mensagens, { papel: 'usuario', texto: limpo }];
    setMensagens(novas);
    setRascunho('');
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagens: novas }),
      });
      const dados = await resposta.json();

      if (dados.ok) {
        setMensagens([...novas, { papel: 'assistente', texto: dados.texto }]);
      } else {
        setErro(dados.erro ?? 'Não foi possível consultar a IA.');
      }
    } catch {
      setErro('Falha de rede ao consultar a IA.');
    } finally {
      setCarregando(false);
      requestAnimationFrame(() => fim.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  if (!disponivel) {
    return (
      <Aviso tom="alerta">
        <strong>IA não configurada.</strong> Adicione <code>ANTHROPIC_API_KEY</code> ao arquivo{' '}
        <code>.env</code> e reinicie o container. Todo o resto do sistema funciona normalmente sem
        ela — a IA nunca é caminho crítico aqui.
      </Aviso>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-start">
      <Cartao padding={false} className="flex min-h-[520px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {mensagens.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <span className="text-petroleo-300">
                <IconeIA tamanho={44} />
              </span>
              <p className="mt-3 max-w-sm text-sm text-tinta-suave">
                Pergunte sobre os animais, as despesas ou os padrinhos. Ou peça um texto pronto para
                mandar no grupo dos padrinhos.
              </p>
            </div>
          ) : (
            mensagens.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.papel === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.papel === 'usuario'
                      ? 'bg-petroleo-800 text-white'
                      : 'border border-tinta-borda bg-tinta-fundo text-tinta'
                  }`}
                >
                  {m.texto}
                  {m.papel === 'assistente' ? (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(m.texto)}
                      className="mt-2 block text-xs font-bold text-petroleo-600 hover:underline"
                    >
                      copiar texto
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}

          {carregando ? (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-tinta-borda bg-tinta-fundo px-4 py-3">
                <span className="esqueleto block h-3 w-32" />
              </div>
            </div>
          ) : null}

          <div ref={fim} />
        </div>

        {erro ? (
          <div className="px-5 pb-3">
            <Aviso tom="risco">{erro}</Aviso>
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(rascunho);
          }}
          className="flex gap-2 border-t border-tinta-borda p-3"
        >
          <input
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            placeholder="Pergunte alguma coisa sobre os animais ou as contas..."
            className="campo flex-1"
            aria-label="Pergunta para a IA"
            disabled={carregando}
          />
          <button type="submit" className="botao-primario" disabled={carregando || !rascunho.trim()}>
            Perguntar
          </button>
        </form>
      </Cartao>

      <Cartao>
        <h2 className="titulo-seccao">Perguntas prontas</h2>
        <ul className="mt-3 space-y-2">
          {ATALHOS.map((a) => (
            <li key={a}>
              <button
                type="button"
                onClick={() => enviar(a)}
                disabled={carregando}
                className="w-full rounded-xl border border-tinta-borda bg-white px-3 py-2.5 text-left text-xs font-semibold leading-snug text-tinta-suave transition hover:border-petroleo-300 hover:text-petroleo-800 disabled:opacity-50"
              >
                {a}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-tinta-clara">
          A IA lê um resumo dos dados da ONG — números, nomes de animais, saldos. Nome, e-mail e
          telefone de padrinho não são enviados.
        </p>
      </Cartao>
    </div>
  );
}
