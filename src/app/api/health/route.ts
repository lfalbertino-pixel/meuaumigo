import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Healthcheck do compose. Bate no banco de propósito: um container que
 * responde 200 sem conseguir ler o Postgres do host está "no ar" e
 * inútil — e é justamente esse o modo de falha desta VPS.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, banco: 'ok' });
  } catch (erro) {
    console.error('[health] banco indisponível', erro);
    return NextResponse.json({ ok: false, banco: 'erro' }, { status: 503 });
  }
}
