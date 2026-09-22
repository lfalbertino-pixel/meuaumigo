import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { lerSessao, PAPEIS_ONG } from '@/lib/auth';
import { etag, ler } from '@/lib/storage';

/**
 * Comprovante de despesa. Ao contrário da foto, este NÃO é público por
 * padrão: só sai quem a ONG marcou como publicável — ou a própria
 * equipe, autenticada. Nota fiscal traz CNPJ, endereço e às vezes o
 * nome do veterinário; publicar tudo por engano é dano que não volta.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const comprovante = await db.comprovante.findUnique({
    where: { id },
    select: { arquivo: true, mimeType: true, publico: true, titulo: true },
  });
  if (!comprovante) return new NextResponse('Não encontrado', { status: 404 });

  if (!comprovante.publico) {
    const sessao = await lerSessao();
    if (!sessao || !PAPEIS_ONG.includes(sessao.papel)) {
      return new NextResponse('Não encontrado', { status: 404 });
    }
  }

  const dados = await ler('comprovantes', comprovante.arquivo);
  if (!dados) return new NextResponse('Arquivo indisponível', { status: 404 });

  return new NextResponse(new Uint8Array(dados), {
    headers: {
      'Content-Type': comprovante.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(comprovante.titulo)}"`,
      'Cache-Control': comprovante.publico
        ? 'public, max-age=31536000, immutable'
        : 'private, no-store',
      ETag: etag(comprovante.arquivo),
    },
  });
}
