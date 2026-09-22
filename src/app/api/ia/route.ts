import { NextResponse } from 'next/server';
import { z } from 'zod';
import { exigirEquipe } from '@/lib/auth';
import { perguntar, type MensagemIA } from '@/server/ia/assistente';

export const dynamic = 'force-dynamic';
// O contexto é montado a cada pergunta e a resposta pode passar dos 10s
// padrão da Vercel; aqui rodamos em container próprio, mas deixar o teto
// explícito evita surpresa se um dia migrar.
export const maxDuration = 60;

const esquema = z.object({
  mensagens: z
    .array(
      z.object({
        papel: z.enum(['usuario', 'assistente']),
        texto: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  // A IA enxerga o retrato financeiro inteiro da ONG: só a equipe entra.
  await exigirEquipe();

  const corpo = esquema.safeParse(await req.json().catch(() => null));
  if (!corpo.success) {
    return NextResponse.json({ ok: false, erro: 'Requisição inválida.' }, { status: 400 });
  }

  const resultado = await perguntar(corpo.data.mensagens as MensagemIA[]);
  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 503 });
}
