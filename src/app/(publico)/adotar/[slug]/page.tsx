import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FotoAnimal } from '@/components/FotoAnimal';
import { Cartao } from '@/components/ui';
import { ESPECIE, PORTE, SEXO, formatarIdade } from '@/lib/format';
import { carregarPerfilPublico } from '@/server/publico';
import { FormularioAdocao } from './Formulario';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const perfil = await carregarPerfilPublico(slug);
  return { title: perfil ? `Adotar o ${perfil.animal.nome}` : 'Adotar' };
}

export default async function Adotar({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const perfil = await carregarPerfilPublico(slug);
  if (!perfil) notFound();

  const { animal } = perfil;

  if (animal.status !== 'DISPONIVEL_ADOCAO') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-4xl" aria-hidden>
          🐾
        </p>
        <h1 className="mt-3 text-2xl font-extrabold text-petroleo-900">
          O {animal.nome} não está disponível para adoção agora
        </h1>
        <p className="mt-2 text-tinta-suave">
          Ele ainda está em tratamento ou já tem um processo em andamento. Você pode apadrinhá-lo e
          acompanhar a recuperação de perto.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/animais/${animal.slug}`} className="botao-primario">
            Conhecer o {animal.nome}
          </Link>
          <Link href="/animais?especial=adocao" className="botao-secundario">
            Ver quem está para adoção
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href={`/animais/${animal.slug}`} className="botao-fantasma -ml-3 mb-3">
        ← Voltar para o {animal.nome}
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight text-petroleo-900 sm:text-4xl">
        Quero adotar o {animal.nome} 🏡
      </h1>
      <p className="mt-2 max-w-2xl text-tinta-suave">
        Preencha o formulário abaixo. A equipe entra em contato para conversar antes de qualquer
        decisão — adoção não é entrega, é encontro.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-[200px_1fr] sm:items-start">
        <Cartao padding={false} className="overflow-hidden">
          <div className="aspect-square bg-tinta-borda">
            <FotoAnimal
              fotoId={animal.fotoCapaId}
              nome={animal.nome}
              prioridade
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-4">
            <p className="font-extrabold text-petroleo-900">{animal.nome}</p>
            <p className="mt-0.5 text-xs text-tinta-suave">
              {ESPECIE[animal.especie]} · {SEXO[animal.sexo]}
              <br />
              {formatarIdade(animal.dataNascimento, animal.idadeAproximada)}
              <br />
              {PORTE[animal.porte]}
            </p>
          </div>
        </Cartao>

        <Cartao>
          <FormularioAdocao
            animalId={animal.id}
            animalNome={animal.nome}
            animalSlug={animal.slug}
          />
        </Cartao>
      </div>
    </div>
  );
}
