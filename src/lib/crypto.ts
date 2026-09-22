import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';

/** Token de sessão: 32 bytes de aleatoriedade real, em hex. */
export function gerarToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * O banco guarda só o hash do token. Um dump do banco não dá sessão a
 * ninguém. SHA-256 basta aqui: o token já é aleatório e longo, não há
 * o que adivinhar por força bruta.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashSenha(senha: string): Promise<string> {
  return hash(senha, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function conferirSenha(hashArmazenado: string, senha: string): Promise<boolean> {
  try {
    return await verify(hashArmazenado, senha);
  } catch {
    return false;
  }
}
