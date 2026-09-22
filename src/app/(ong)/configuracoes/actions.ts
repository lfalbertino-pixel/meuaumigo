'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { conferirMesmaOrigem, exigirAdmin, registrarAuditoria } from '@/lib/auth';
import { hashSenha } from '@/lib/crypto';

export type EstadoConfig = { erro?: string; ok?: string };

export async function salvarConfiguracao(
  _anterior: EstadoConfig,
  dados: FormData,
): Promise<EstadoConfig> {
  await conferirMesmaOrigem();
  const usuario = await exigirAdmin();

  const esquema = z.object({
    nome: z.string().trim().min(2).max(120),
    cnpj: z.string().trim().max(20).optional(),
    email: z.string().trim().email('E-mail inválido.').optional().or(z.literal('')),
    telefone: z.string().trim().max(30).optional(),
    whatsapp: z.string().trim().max(30).optional(),
    cidade: z.string().trim().max(80).optional(),
    estado: z.string().trim().max(2).optional(),
    sobre: z.string().trim().max(2000).optional(),
    chavePix: z.string().trim().max(140).optional(),
    instagram: z.string().trim().max(80).optional(),
    frase: z.string().trim().min(5).max(200),
  });

  const bruto = esquema.safeParse(Object.fromEntries(dados));
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };
  const e = { ...bruto.data, email: bruto.data.email || undefined };

  await db.configuracaoOng.upsert({
    where: { id: 'unica' },
    create: { id: 'unica', ...e },
    update: e,
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    acao: 'configuracao.salva',
    entidade: 'ConfiguracaoOng',
    entidadeId: 'unica',
  });

  revalidatePath('/configuracoes');
  revalidatePath('/', 'layout');
  return { ok: 'Configuração salva.' };
}

export async function criarUsuario(_anterior: EstadoConfig, dados: FormData): Promise<EstadoConfig> {
  await conferirMesmaOrigem();
  const admin = await exigirAdmin();

  const esquema = z.object({
    nome: z.string().trim().min(3, 'Informe o nome.').max(120),
    email: z.string().trim().toLowerCase().email('E-mail inválido.'),
    senha: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres.').max(200),
    papel: z.enum(['ADMIN', 'EQUIPE', 'VETERINARIO']),
  });

  const bruto = esquema.safeParse({
    nome: dados.get('nome'),
    email: dados.get('email'),
    senha: dados.get('senha'),
    papel: dados.get('papel'),
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };

  const existe = await db.usuario.findUnique({ where: { email: bruto.data.email } });
  if (existe) return { erro: 'Já existe um acesso com este e-mail.' };

  const criado = await db.usuario.create({
    data: {
      nome: bruto.data.nome,
      email: bruto.data.email,
      senhaHash: await hashSenha(bruto.data.senha),
      papel: bruto.data.papel,
    },
  });

  await registrarAuditoria({
    usuarioId: admin.id,
    acao: 'usuario.criado',
    entidade: 'Usuario',
    entidadeId: criado.id,
    detalhe: { email: criado.email, papel: criado.papel },
  });

  revalidatePath('/configuracoes');
  return { ok: `Acesso criado para ${criado.nome}.` };
}

export async function alternarUsuario(_anterior: EstadoConfig, dados: FormData): Promise<EstadoConfig> {
  await conferirMesmaOrigem();
  const admin = await exigirAdmin();

  const id = String(dados.get('id') ?? '');
  if (!id) return { erro: 'Usuário não identificado.' };

  // Um admin desativando a si mesmo se tranca fora do sistema, e não há
  // outro caminho de volta além de mexer no banco à mão.
  if (id === admin.id) return { erro: 'Você não pode desativar o seu próprio acesso.' };

  const alvo = await db.usuario.findUnique({ where: { id }, select: { ativo: true, nome: true } });
  if (!alvo) return { erro: 'Usuário não encontrado.' };

  await db.usuario.update({ where: { id }, data: { ativo: !alvo.ativo } });

  // Desativar sem revogar sessão deixa a pessoa dentro até o cookie
  // expirar — o que pode ser meio dia inteiro.
  if (alvo.ativo) {
    await db.sessaoLogin.updateMany({
      where: { usuarioId: id, revogadaEm: null },
      data: { revogadaEm: new Date() },
    });
  }

  await registrarAuditoria({
    usuarioId: admin.id,
    acao: alvo.ativo ? 'usuario.desativado' : 'usuario.reativado',
    entidade: 'Usuario',
    entidadeId: id,
  });

  revalidatePath('/configuracoes');
  return { ok: `${alvo.nome} foi ${alvo.ativo ? 'desativado' : 'reativado'}.` };
}

export async function criarVeterinario(
  _anterior: EstadoConfig,
  dados: FormData,
): Promise<EstadoConfig> {
  await conferirMesmaOrigem();
  const admin = await exigirAdmin();

  const esquema = z.object({
    nome: z.string().trim().min(3, 'Informe o nome.').max(120),
    crmv: z.string().trim().max(20).optional(),
    clinica: z.string().trim().max(120).optional(),
    telefone: z.string().trim().max(30).optional(),
  });

  const bruto = esquema.safeParse({
    nome: dados.get('nome'),
    crmv: dados.get('crmv') || undefined,
    clinica: dados.get('clinica') || undefined,
    telefone: dados.get('telefone') || undefined,
  });
  if (!bruto.success) return { erro: bruto.error.issues[0]?.message };

  const vet = await db.veterinario.create({ data: bruto.data });

  await registrarAuditoria({
    usuarioId: admin.id,
    acao: 'veterinario.criado',
    entidade: 'Veterinario',
    entidadeId: vet.id,
  });

  revalidatePath('/configuracoes');
  return { ok: `${vet.nome} cadastrado.` };
}
