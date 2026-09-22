import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Client único. A aplicação conecta com o papel `meuaumigo_app`, que só
 * tem DML — nenhum CREATE, ALTER ou DROP. Quem altera schema é o
 * `prisma migrate deploy` do entrypoint, com o papel dono.
 */
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalParaPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalParaPrisma.prisma = db;
