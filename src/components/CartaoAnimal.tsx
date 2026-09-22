import Link from 'next/link';
import type { CartaoAnimal as Dados } from '@/server/publico';
import { FAIXA_ETARIA, PORTE, SEXO, STATUS_ANIMAL, porcento, reaisCurto } from '@/lib/format';
import { FotoAnimal } from './FotoAnimal';
import { BarraMeta } from './ui';

/**
 * O cartão da vitrine. Tudo nele existe para responder a uma pergunta
 * só: "por que eu ajudaria este aqui?". Por isso a barra de apoio vem
 * antes do botão, e o que falta em reais vem escrito — "70%" é abstrato,
 * "faltam R$ 150" é uma decisão.
 */
export function CartaoAnimalVitrine({ animal, prioridade = false }: { animal: Dados; prioridade?: boolean }) {
  const { custo } = animal;
  const status = STATUS_ANIMAL[animal.status as keyof typeof STATUS_ANIMAL];
  const precisa = custo.padrinhos === 0;

  return (
    <article className="group cartao flex flex-col overflow-hidden p-0 transition duration-200 ease-entrada hover:-translate-y-0.5 hover:shadow-flutuante">
      <Link href={`/animais/${animal.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-tinta-borda">
        <FotoAnimal
          fotoId={animal.fotoId}
          nome={animal.nome}
          prioridade={prioridade}
          className="h-full w-full object-cover transition duration-500 ease-entrada group-hover:scale-[1.04]"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {precisa ? (
            <span className="selo bg-laranja-500 text-white shadow-cartao">Precisa de padrinho</span>
          ) : (
            <span className="selo bg-white/95 text-petroleo-800 shadow-cartao">
              ❤️ {custo.padrinhos} {custo.padrinhos === 1 ? 'padrinho' : 'padrinhos'}
            </span>
          )}
          {animal.necessidadeEspecial ? (
            <span className="selo bg-white/95 text-petroleo-800 shadow-cartao">Cuidado especial</span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-extrabold leading-tight text-petroleo-900">
          <Link href={`/animais/${animal.slug}`} className="hover:text-laranja-600">
            {animal.nome}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-tinta-suave">
          {SEXO[animal.sexo]} · {animal.faixa ? FAIXA_ETARIA[animal.faixa] : 'Idade indefinida'} ·{' '}
          {PORTE[animal.porte].replace('Porte ', 'porte ')}
        </p>

        {animal.status === 'DISPONIVEL_ADOCAO' ? (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            {status.ponto} Também disponível para adoção
          </p>
        ) : null}

        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
            <span className="font-bold tabular-nums text-petroleo-800">
              {porcento(custo.percentual)} apoiado
            </span>
            <span className="tabular-nums text-tinta-suave">
              {custo.falta > 0 ? `faltam ${reaisCurto(custo.falta)}` : 'meta completa 🎉'}
            </span>
          </div>
          <BarraMeta percentual={custo.percentual} rotulo={`Apoio mensal de ${animal.nome}`} />
        </div>

        <Link
          href={`/animais/${animal.slug}`}
          className="botao-secundario mt-4 w-full group-hover:border-laranja-300 group-hover:text-laranja-700"
        >
          Conhecer {animal.nome}
        </Link>
      </div>
    </article>
  );
}
