import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { lerSessao } from '@/lib/auth';
import { FormularioLogin } from './Formulario';

export const metadata: Metadata = { title: 'Entrar', robots: { index: false, follow: false } };

export default async function Entrar() {
  const sessao = await lerSessao();
  if (sessao) redirect(sessao.padrinhoId ? '/meus-aumigos' : '/painel');

  return (
    <>
      <h1 className="mb-1 text-center text-xl font-extrabold text-petroleo-900">Bem-vindo de volta</h1>
      <p className="mb-5 text-center text-sm text-tinta-suave">
        Área da equipe e dos padrinhos.
      </p>

      <FormularioLogin />

      <p className="mt-5 text-center text-sm text-tinta-suave">
        Ainda não é padrinho?{' '}
        <Link href="/animais" className="font-bold text-laranja-600 hover:underline">
          Conheça os AUmigos
        </Link>
      </p>
    </>
  );
}
