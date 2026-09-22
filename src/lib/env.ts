import { z } from 'zod';

/**
 * Ambiente tipado e centralizado. Nada de `process.env` espalhado: um
 * segredo ausente derruba o boot, em vez de falhar no meio de um
 * apadrinhamento — que é o momento exato em que ninguém tenta de novo.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().min(1),

  STORAGE_DIR: z.string().default('/app/storage'),

  APP_URL: z.string().url().default('http://localhost:3000'),
  SESSAO_HORAS: z.coerce.number().int().min(1).max(72).default(12),

  // Sem chave, a tela da IA mostra "não configurado" e o resto do sistema
  // funciona igual. A IA nunca é caminho crítico.
  ANTHROPIC_API_KEY: z.string().optional(),
  MODELO_IA: z.string().default('claude-sonnet-5'),

  SEMEAR_DEMONSTRACAO: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const detalhe = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Variáveis de ambiente inválidas:\n${detalhe}`);
}

export const env = parsed.data;
export const ehProducao = env.NODE_ENV === 'production';
export const iaDisponivel = Boolean(env.ANTHROPIC_API_KEY);
