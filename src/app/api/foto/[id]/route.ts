import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { etag, ler } from '@/lib/storage';

/**
 * Serve a foto do animal. Pública de propósito: é ela que aparece no
 * preview do link compartilhado no WhatsApp, e um preview que exige
 * login não aparece.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const foto = await db.foto.findUnique({
    where: { id },
    select: { arquivo: true, mimeType: true },
  });
  if (!foto) return new NextResponse('Não encontrado', { status: 404 });

  const dados = await ler('animais', foto.arquivo);
  if (!dados) return new NextResponse('Arquivo indisponível', { status: 404 });

  return new NextResponse(new Uint8Array(dados), {
    headers: {
      'Content-Type': foto.mimeType,
      // O arquivo nunca muda depois de escrito — o nome dele é único.
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: etag(foto.arquivo),
    },
  });
}
