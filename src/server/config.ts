import { cache } from 'react';
import { db } from '@/lib/db';

/**
 * Configuração da ONG — linha única, lida em quase toda página pública
 * (rodapé, texto de compartilhamento, chave PIX). Memoizada por
 * requisição para não virar dez SELECTs no mesmo render.
 */
export const lerConfiguracao = cache(async () => {
  const config = await db.configuracaoOng.findUnique({ where: { id: 'unica' } });
  return (
    config ?? {
      id: 'unica',
      nome: 'Meu AUmigo',
      cnpj: null,
      email: null,
      telefone: null,
      whatsapp: null,
      cidade: null,
      estado: null,
      sobre: null,
      chavePix: null,
      instagram: null,
      frase: 'Você apadrinha. A gente cuida. E um AUmigo ganha uma nova chance.',
      atualizadoEm: new Date(),
    }
  );
});
