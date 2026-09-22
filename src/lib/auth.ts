import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { PapelUsuario } from '@prisma/client';
import { db } from './db';
import { gerarToken, hashToken } from './crypto';
import { env, ehProducao } from './env';

const COOKIE = 'meuaumigo_sessao';

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  /** Preenchido só para quem é padrinho: é a chave da área "Meus AUmigos". */
  padrinhoId: string | null;
};

/** Quem enxerga a administração da ONG. Padrinho, nunca. */
export const PAPEIS_ONG: PapelUsuario[] = ['ADMIN', 'EQUIPE', 'VETERINARIO'];

// ----------------------------------------------------------
// Ciclo de vida da sessão
// ----------------------------------------------------------

export async function criarSessao(usuarioId: string): Promise<void> {
  const token = gerarToken();
  const expiraEm = new Date(Date.now() + env.SESSAO_HORAS * 60 * 60 * 1000);
  const h = await headers();

  await db.sessaoLogin.create({
    data: {
      usuarioId,
      tokenHash: hashToken(token),
      expiraEm,
      ip: await ipCliente(),
      userAgent: h.get('user-agent') ?? undefined,
    },
  });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Atrás do Cloudflare Tunnel o TLS termina no proxy; o header diz a verdade.
    secure: ehProducao || h.get('x-forwarded-proto') === 'https',
    path: '/',
    expires: expiraEm,
  });
}

export async function encerrarSessao(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db.sessaoLogin.updateMany({
      where: { tokenHash: hashToken(token), revogadaEm: null },
      data: { revogadaEm: new Date() },
    });
  }
  jar.delete(COOKIE);
}

/** Memoizado por requisição: vários usos no mesmo render batem no banco uma vez. */
export const lerSessao = cache(async (): Promise<UsuarioSessao | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const sessao = await db.sessaoLogin.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: { include: { padrinho: { select: { id: true } } } } },
  });

  if (!sessao || sessao.revogadaEm || sessao.expiraEm < new Date()) return null;
  if (!sessao.usuario.ativo || sessao.usuario.deletadoEm) return null;

  return {
    id: sessao.usuario.id,
    nome: sessao.usuario.nome,
    email: sessao.usuario.email,
    papel: sessao.usuario.papel,
    padrinhoId: sessao.usuario.padrinho?.id ?? null,
  };
});

export async function exigirUsuario(): Promise<UsuarioSessao> {
  const usuario = await lerSessao();
  if (!usuario) redirect('/entrar');
  return usuario;
}

/**
 * Área da ONG. Um padrinho autenticado que digite /painel não recebe
 * "acesso negado" — vai para a área dele, que é onde ele quer estar.
 */
export async function exigirEquipe(): Promise<UsuarioSessao> {
  const usuario = await exigirUsuario();
  if (!PAPEIS_ONG.includes(usuario.papel)) redirect('/meus-aumigos');
  return usuario;
}

/** Financeiro inteiro, configurações e exclusões: só a direção. */
export async function exigirAdmin(): Promise<UsuarioSessao> {
  const usuario = await exigirEquipe();
  if (usuario.papel !== 'ADMIN') {
    throw new Error('Esta ação é exclusiva da administração da ONG.');
  }
  return usuario;
}

export async function exigirPadrinho(): Promise<UsuarioSessao & { padrinhoId: string }> {
  const usuario = await exigirUsuario();
  if (!usuario.padrinhoId) redirect('/painel');
  return usuario as UsuarioSessao & { padrinhoId: string };
}

/**
 * Defesa extra de CSRF em mutações; complementa o SameSite do cookie.
 *
 * Aceita duas origens: a configurada em `APP_URL` e a da própria
 * requisição (host encaminhado pelo proxy). A segunda existe porque o app
 * fica atrás de um túnel: se o domínio mudar e alguém esquecer de ajustar
 * o `APP_URL`, o login para de funcionar com um erro que não explica nada.
 *
 * Isso não afrouxa a proteção: num POST vindo de outro site, o `Origin` é
 * o do site atacante, e continua diferente do host da requisição.
 */
export async function conferirMesmaOrigem(): Promise<void> {
  const h = await headers();
  const origem = h.get('origin');
  if (!origem) return; // navegação same-origin não envia Origin

  const hostDaRequisicao = h.get('x-forwarded-host') ?? h.get('host');
  const permitidas = new Set([new URL(env.APP_URL).origin]);
  if (hostDaRequisicao) {
    const protocolo = h.get('x-forwarded-proto') ?? (ehProducao ? 'https' : 'http');
    permitidas.add(`${protocolo}://${hostDaRequisicao}`);
  }

  if (!permitidas.has(origem)) {
    console.warn(`[auth] origem recusada: ${origem} (esperado: ${[...permitidas].join(' ou ')})`);
    throw new Error('Origem não permitida.');
  }
}

// ----------------------------------------------------------
// Auditoria
// ----------------------------------------------------------

/**
 * Append-only no banco (ver grants.sql). Toda mudança de dinheiro,
 * apadrinhamento e status de animal passa por aqui: quando um padrinho
 * perguntar por que a mensalidade dele mudou, a resposta existe.
 */
export async function registrarAuditoria(dados: {
  usuarioId?: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  detalhe?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.logAuditoria.create({
      data: {
        usuarioId: dados.usuarioId,
        acao: dados.acao,
        entidade: dados.entidade,
        entidadeId: dados.entidadeId,
        detalhe: dados.detalhe as never,
        ip: await ipCliente(),
      },
    });
  } catch (erro) {
    // Auditoria não derruba a operação. Falhar em silêncio, não.
    console.error('[auditoria] falha ao registrar', dados.acao, erro);
  }
}

export async function ipCliente(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get('cf-connecting-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    undefined
  );
}
