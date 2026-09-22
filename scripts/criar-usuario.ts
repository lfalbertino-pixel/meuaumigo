/**
 * Cria ou redefine um acesso pela linha de comando.
 *
 * Existe para o caso em que ninguém consegue entrar — admin desativado
 * por engano, senha perdida. É o único caminho de volta que não exige
 * mexer no banco à mão.
 *
 *   docker compose exec app node_modules/.bin/tsx scripts/criar-usuario.ts \
 *     "Nome da Pessoa" email@ong.com.br senhaSegura ADMIN
 */

import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const db = new PrismaClient();

async function main() {
  const [nome, email, senha, papel = 'EQUIPE'] = process.argv.slice(2);

  if (!nome || !email || !senha) {
    console.error('Uso: tsx scripts/criar-usuario.ts "Nome" email senha [ADMIN|EQUIPE|VETERINARIO]');
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error('A senha precisa ter ao menos 8 caracteres.');
    process.exit(1);
  }
  if (!['ADMIN', 'EQUIPE', 'VETERINARIO'].includes(papel)) {
    console.error('Papel inválido. Use ADMIN, EQUIPE ou VETERINARIO.');
    process.exit(1);
  }

  const senhaHash = await hash(senha, { memoryCost: 19456, timeCost: 2, parallelism: 1 });

  const usuario = await db.usuario.upsert({
    where: { email: email.toLowerCase() },
    create: {
      nome,
      email: email.toLowerCase(),
      senhaHash,
      papel: papel as 'ADMIN' | 'EQUIPE' | 'VETERINARIO',
    },
    // Reativa junto: quem roda isto quase sempre está destrancando a porta.
    update: { nome, senhaHash, papel: papel as 'ADMIN' | 'EQUIPE' | 'VETERINARIO', ativo: true, deletadoEm: null },
  });

  console.log(`✓ ${usuario.nome} <${usuario.email}> — ${usuario.papel}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
