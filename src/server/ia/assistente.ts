import Anthropic from '@anthropic-ai/sdk';
import { env, iaDisponivel } from '@/lib/env';
import { montarContexto } from './contexto';

/**
 * Meu AUmigo AI — apoio à equipe, não ao público.
 *
 * O que ela faz: escreve rascunho de atualização para padrinhos, resume
 * histórico, aponta onde a despesa cresceu, sugere texto de campanha.
 *
 * O que ela NÃO faz: decidir tratamento, prometer nada a padrinho em nome
 * da ONG, ou publicar sozinha. Todo texto que sai daqui passa pela equipe
 * antes de virar comunicação — é por isso que a tela devolve texto para
 * copiar, e não um botão de "enviar".
 */

const INSTRUCAO = `Você é o assistente interno do Meu AUmigo, um sistema de apadrinhamento de animais resgatados usado pela equipe de uma ONG brasileira.

Você recebe, a cada pergunta, um retrato atual dos dados da ONG. Responda SEMPRE com base nesse retrato.

Regras:
- Responda em português do Brasil, direto, sem rodeio e sem elogiar a pergunta.
- Use os números do contexto. Se o dado não estiver lá, diga que não está — nunca estime nem invente valor, nome de animal ou data.
- Valores em reais no formato brasileiro (R$ 1.234,56).
- Quando listar animais, use o nome deles.
- Texto para padrinho ou para rede social: escreva pronto para copiar, caloroso mas sem pieguice, sem prometer cura nem resultado.
- Nunca dê orientação clínica, dose de medicamento ou diagnóstico: isso é do veterinário responsável.
- Nunca escreva em nome da ONG algo que comprometa dinheiro ou prazo (garantias, promessas de devolução, compromisso de data).
- Seja curto. Se a resposta cabe em três linhas, use três linhas.`;

export type MensagemIA = { papel: 'usuario' | 'assistente'; texto: string };

export async function perguntar(
  historico: MensagemIA[],
): Promise<{ ok: true; texto: string } | { ok: false; erro: string }> {
  if (!iaDisponivel) {
    return {
      ok: false,
      erro: 'A IA não está configurada. Adicione ANTHROPIC_API_KEY ao .env e reinicie o container.',
    };
  }

  try {
    const contexto = await montarContexto();
    const cliente = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const resposta = await cliente.messages.create({
      model: env.MODELO_IA,
      max_tokens: 1400,
      system: [
        { type: 'text', text: INSTRUCAO },
        // O retrato dos dados vai depois da instrução e muda a cada
        // pergunta; a instrução, não. Mantê-los em blocos separados é o
        // que permite o cache do prompt fazer efeito.
        { type: 'text', text: `DADOS ATUAIS DA ONG\n\n${contexto}` },
      ],
      messages: historico.slice(-10).map((m) => ({
        role: m.papel === 'usuario' ? ('user' as const) : ('assistant' as const),
        content: m.texto,
      })),
    });

    const texto = resposta.content
      .filter((bloco): bloco is Anthropic.TextBlock => bloco.type === 'text')
      .map((bloco) => bloco.text)
      .join('\n')
      .trim();

    return texto
      ? { ok: true, texto }
      : { ok: false, erro: 'A IA não devolveu texto. Tente reformular a pergunta.' };
  } catch (erro) {
    console.error('[ia] falha ao consultar', erro);
    return {
      ok: false,
      erro: 'Não consegui falar com a IA agora. O resto do sistema segue funcionando normalmente.',
    };
  }
}
