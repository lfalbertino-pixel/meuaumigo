import type { Metadata } from 'next';
import { TituloPagina } from '@/components/ui';
import { exigirEquipe } from '@/lib/auth';
import { iaDisponivel } from '@/lib/env';
import { ChatIA } from './Chat';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Meu AUmigo AI' };

export default async function PaginaIA() {
  await exigirEquipe();

  return (
    <>
      <TituloPagina
        titulo="Meu AUmigo AI 🐾"
        descricao="Apoio para a equipe: resumir, analisar e escrever. Tudo que sai daqui é rascunho — quem publica é você."
      />
      <ChatIA disponivel={iaDisponivel} />
    </>
  );
}
