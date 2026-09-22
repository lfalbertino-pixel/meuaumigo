import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FotoAnimal } from '@/components/FotoAnimal';
import { BarraMeta, Cartao } from '@/components/ui';
import { porcento, reais } from '@/lib/format';
import { carregarPerfilPublico } from '@/server/publico';
import { lerConfiguracao } from '@/server/config';
import { FormularioApadrinhamento } from './Formulario';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const perfil = await carregarPerfilPublico(slug);
  return { title: perfil ? `Apadrinhar o ${perfil.animal.nome}` : 'Apadrinhar' };
}

export default async function Apadrinhar({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [perfil, config] = await Promise.all([carregarPerfilPublico(slug), lerConfiguracao()]);
  if (!perfil) notFound();

  const { animal, custo } = perfil;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href={`/animais/${animal.slug}`} className="botao-fantasma -ml-3 mb-3">
        ← Voltar para o {animal.nome}
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight text-petroleo-900 sm:text-4xl">
        Apadrinhe o {animal.nome} 🐾
      </h1>
      <p className="mt-2 max-w-2xl text-tinta-suave">
        Em dois minutos você assume uma parte do custo mensal dele — e passa a acompanhar, de perto,
        o que o seu apoio muda na vida do {animal.nome}.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <Cartao className="p-6">
          <FormularioApadrinhamento
            animalId={animal.id}
            animalNome={animal.nome}
            animalSlug={animal.slug}
            falta={custo.falta}
            chavePix={config.chavePix}
          />
        </Cartao>

        <aside className="lg:sticky lg:top-24">
          <Cartao padding={false} className="overflow-hidden">
            <div className="aspect-[4/3] bg-tinta-borda">
              <FotoAnimal
                fotoId={animal.fotoCapaId}
                nome={animal.nome}
                prioridade
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-extrabold text-petroleo-900">{animal.nome}</h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-tinta-suave">🍖 Alimentação</dt>
                  <dd className="tabular-nums font-semibold">{reais(custo.alimentacao)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-tinta-suave">🏥 Tratamento</dt>
                  <dd className="tabular-nums font-semibold">{reais(custo.tratamento)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-tinta-suave">💊 Medicamentos</dt>
                  <dd className="tabular-nums font-semibold">{reais(custo.medicamento)}</dd>
                </div>
                <div className="flex justify-between border-t border-tinta-borda pt-1.5">
                  <dt className="font-bold text-petroleo-900">Custo mensal</dt>
                  <dd className="tabular-nums font-extrabold">{reais(custo.total)}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <BarraMeta percentual={custo.percentual} rotulo={`Apoio de ${animal.nome}`} />
                <p className="mt-1.5 text-xs font-semibold tabular-nums text-tinta-suave">
                  {porcento(custo.percentual)} apoiado ·{' '}
                  {custo.falta > 0 ? `faltam ${reais(custo.falta)}` : 'meta completa'}
                </p>
              </div>
            </div>
          </Cartao>
        </aside>
      </div>
    </div>
  );
}
