import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from './env';

/**
 * Mídia em disco, no volume montado. Nome de arquivo sempre gerado aqui:
 * o nome que veio do navegador nunca toca o sistema de arquivos.
 */

export type Pasta = 'animais' | 'comprovantes';

const MIMES_IMAGEM = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MIMES_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime'];
const MIMES_DOCUMENTO = ['application/pdf', ...MIMES_IMAGEM];

export function mimeDeImagemOuVideo(mime: string): boolean {
  return MIMES_IMAGEM.includes(mime) || MIMES_VIDEO.includes(mime);
}

export function mimeDeComprovante(mime: string): boolean {
  return MIMES_DOCUMENTO.includes(mime);
}

function extensao(mime: string): string {
  const mapa: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'application/pdf': 'pdf',
  };
  return mapa[mime] ?? 'bin';
}

function caminho(pasta: Pasta, arquivo: string): string {
  // `basename` fecha a porta de "../../etc/passwd" vindo do banco.
  return path.join(env.STORAGE_DIR, pasta, path.basename(arquivo));
}

export async function guardar(
  pasta: Pasta,
  dados: Buffer | Uint8Array,
  mime: string,
): Promise<{ arquivo: string; bytes: number }> {
  const destino = path.join(env.STORAGE_DIR, pasta);
  await mkdir(destino, { recursive: true });

  const nome = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${extensao(mime)}`;
  const buffer = Buffer.from(dados);
  await writeFile(path.join(destino, nome), buffer);
  return { arquivo: nome, bytes: buffer.byteLength };
}

export async function ler(pasta: Pasta, arquivo: string): Promise<Buffer | null> {
  try {
    return await readFile(caminho(pasta, arquivo));
  } catch {
    return null;
  }
}

export async function apagar(pasta: Pasta, arquivo: string): Promise<void> {
  try {
    await unlink(caminho(pasta, arquivo));
  } catch {
    // Arquivo já sumiu do disco: apagar de novo não é erro.
  }
}

/** ETag estável para cache de foto — o arquivo nunca muda depois de escrito. */
export function etag(arquivo: string): string {
  return `"${createHash('sha1').update(arquivo).digest('hex').slice(0, 16)}"`;
}
