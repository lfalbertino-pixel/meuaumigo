import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FotoAnimal } from '@/components/FotoAnimal';
import { BotaoCompartilhar } from '@/components/Compartilhar';
import { BarraMeta, Cartao, Selo } from '@/components/ui';
import { formatarData, porcento, reais, reaisCurto } from '@/lib/format';
import { listarCampanhasPublicas } from '@/server/publico';
import { lerConfiguracao } from '@/server/config';
import { env } from '@/lib/env';
import { FormularioDoacao } from './Formulario';

export const dynamic = 'force-dynamic';

async function buscar(slug: string) {
  const campanhas = await listarCampanhasPublicas();
  return campanhas.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campanha = await buscar(slug);
  if (!campanha) return { title: 'Campanha não encontrada' };
  return {
    title: campanha.titulo,
    description: campanha.resumo,
    openGraph: {
      title: campanha.titulo,
      description: campanha.resumo,
      images: [
        campanha.animal?.fotoCapaId
          ? `${env.APP_URL}/api/foto/${campanha.animal.fotoCapaId}`
          : `${env.APP_URL}/marca/og-padrao.png`,
      ],
    },
  };
}

export default async function DetalheCampanha({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [campanha, config] = await Promise.all([buscar(slug), lerConfiguracao()]);
  if (!campanha) notFound();

  const pct = (campanha.arrecadado / campanha.meta) * 100;
  const falta = Math.max(0, campanha.meta - campanha.arrecadado);
  const url = `${env.APP_URL}/campanhas/${campanha.slug}`;
  const encerrada = campanha.status !== 'ATIVA';

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/campanhas" className="botao-fantasma -ml-3 mb-3">
        ← Todas as campanhas
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div>
          {campanha.animal ? (
            <Link
              href={`/animais/${campanha.animal.slug}`}
              className="block aspect-[16/9] overflow-hidden rounded-caixa border border-tinta-borda bg-tinta-borda"
            >
              <FotoAnimal
                fotoId={campanha.animal.fotoCapaId}
                nome={campanha.animal.nome}
                prioridade
                className="h-full w-full object-cover"
              />
            </Link>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {campanha.urgente ? <Selo classe="bg-rose-600 text-white">🚨 Urgente</Selo> : null}
            {encerrada ? (
              <Selo classe="bg-emerald-100 text-emerald-800">🎉 Meta atingida</Selo>
            ) : null}
            {campanha.prazo ? (
              <Selo classe="bg-tinta-borda text-tinta-suave">até {formatarData(campanha.prazo)}</Selo>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-petroleo-900 sm:text-4xl">
            {campanha.titulo}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-tinta-suave">{campanha.resumo}</p>

          {campanha.texto ? (
            <div className="mt-5 whitespace-pre-line leading-relaxed text-tinta">
              {campanha.texto}
            </div>
          ) : null}

          {campanha.animal ? (
            <Link
              href={`/animais/${campanha.animal.slug}`}
              className="botao-secundario mt-6 inline-flex"
            >
              🐾 Conhecer a história do {campanha.animal.nome}
            </Link>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24">
          <Cartao className="border-laranja-200">
            <p className="text-3xl font-extrabold tabular-nums text-laranja-700">
              {reaisCurto(campanha.arrecadado)}
            </p>
            <p className="text-sm text-tinta-suave">
              de {reaisCurto(campanha.meta)} · {porcento(pct)}
            </p>

            <div className="mt-3">
              <BarraMeta percentual={pct} altura="h-4" rotulo={campanha.titulo} />
            </div>

            <p className="mt-2 text-sm font-semibold text-tinta-suave">
              {campanha.doadores} {campanha.doadores === 1 ? 'pessoa já ajudou' : 'pessoas já ajudaram'}
              {falta > 0 ? ` · faltam ${reais(falta)}` : ''}
            </p>

            <div className="mt-5">
              {encerrada ? (
                <p className="rounded-xl bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-800">
                  Esta campanha já atingiu a meta. Obrigado a quem ajudou. 🎉
                </p>
              ) : (
                <FormularioDoacao
                  campanhaId={campanha.id}
                  chavePix={config.chavePix}
                  falta={falta}
                />
              )}
            </div>
          </Cartao>

          <div className="mt-4">
            <BotaoCompartilhar
              nome={campanha.titulo}
              url={url}
              texto={`🚨 ${campanha.titulo}\n\n${campanha.resumo}\n\n❤️ Toda ajuda conta.`}
              className="botao-secundario w-full"
            />
          </div>
        </aside>
      </div>
    </article>
  );
}
