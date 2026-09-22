'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirSenha } from '@/lib/crypto';
import { conferirMesmaOrigem, criarSessao, encerrarSessao, registrarAuditoria } from '@/lib/auth';

const esquema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  senha: z.string().min(1, 'Informe a senha.'),
});

export type EstadoLogin = { erro?: string };

export async function entrar(_anterior: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  await conferirMesmaOrigem();

  const bruto = esquema.safeParse({ email: dados.get('email'), senha: dados.get('senha') });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };

  const usuario = await db.usuario.findUnique({
    where: { email: bruto.data.email },
    include: { padrinho: { select: { id: true } } },
  });

  // Mensagem única para usuário inexistente, senha errada e conta
  // desativada: qualquer diferença aqui vira um oráculo de "este e-mail
  // existe no sistema".
  const generico = { erro: 'E-mail ou senha incorretos.' };

  if (!usuario || !usuario.ativo || usuario.deletadoEm) {
    // Gasta o mesmo tempo do caminho feliz, para não vazar por latência.
    await conferirSenha(
      '$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0$Zm9vYmFyZm9vYmFyZm9vYmFyZm9vYmFy',
      bruto.data.senha,
    );
    return generico;
  }

  if (!(await conferirSenha(usuario.senhaHash, bruto.data.senha))) {
    await registrarAuditoria({
      usuarioId: usuario.id,
      acao: 'login.falhou',
      entidade: 'Usuario',
      entidadeId: usuario.id,
    });
    return generico;
  }

  await criarSessao(usuario.id);
  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'login.sucesso',
    entidade: 'Usuario',
    entidadeId: usuario.id,
  });

  redirect(usuario.padrinho ? '/meus-aumigos' : '/painel');
}

export async function sair(): Promise<void> {
  await conferirMesmaOrigem();
  await encerrarSessao();
  redirect('/entrar');
}
