import type { Metadata } from 'next';
import Link from 'next/link';
import { FotoAnimal } from '@/components/FotoAnimal';
import { BarraMeta, Cartao, Selo, TituloPagina, Vazio } from '@/components/ui';
import { IconeBusca } from '@/components/Icones';
import { db } from '@/lib/db';
import { exigirEquipe } from '@/lib/auth';
import { STATUS_ANIMAL, formatarData, formatarIdade, porcento, reaisCurto } from '@/lib/format';
import { calcularCusto, selecaoCusto } from '@/server/custos';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Animais' };

const FILTROS = [
  { chave: '', rotulo: 'Todos' },
  { chave: 'sem-padrinho', rotulo: 'Precisam de padrinho' },
  { chave: 'apadrinhados', rotulo: 'Apadrinhados' },
  { chave: 'adocao', rotulo: 'Para adoção' },
  { chave: 'adotados', rotulo: 'Adotados' },
];

export default async function AnimaisOng({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; q?: string }>;
}) {
  await exigirEquipe();
  const { filtro = '', q = '' } = await searchParams;

  const where: Prisma.AnimalWhereInput = { deletadoEm: null };

  if (filtro === 'sem-padrinho') {
    where.ativo = true;
    where.status = { notIn: ['ADOTADO', 'FALECIDO'] };
    where.apadrinhamentos = { none: { status: 'ATIVO' } };
  } else if (filtro === 'apadrinhados') {
    where.apadrinhamentos = { some: { status: 'ATIVO' } };
  } else if (filtro === 'adocao') {
    where.status = 'DISPONIVEL_ADOCAO';
  } else if (filtro === 'adotados') {
    where.status = 'ADOTADO';
  }

  if (q.trim()) {
    where.OR = [
      { nome: { contains: q.trim(), mode: 'insensitive' } },
      { raca: { contains: q.trim(), mode: 'insensitive' } },
    ];
  }

  const animais = await db.animal.findMany({
    where,
    orderBy: [{ ativo: 'desc' }, { dataResgate: 'desc' }],
    select: {
      id: true,
      slug: true,
      nome: true,
      status: true,
      ativo: true,
      raca: true,
      dataResgate: true,
      dataNascimento: true,
      idadeAproximada: true,
      localAbrigo: true,
      fotoCapaId: true,
      ...selecaoCusto,
    },
  });

  return (
    <>
      <TituloPagina
        titulo="Animais"
        descricao={`${animais.length} ${animais.length === 1 ? 'animal' : 'animais'} nesta visão.`}
        acao={
          <Link href="/animais-ong/novo" className="botao-primario">
            + Cadastrar animal
          </Link>
        }
      />

      <form method="get" className="mb-3 flex gap-2">
        {filtro ? <input type="hidden" name="filtro" value={filtro} /> : null}
        <div className="relative flex-1 sm:max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-clara">
            <IconeBusca tamanho={17} />
          </span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou raça"
            className="campo pl-9"
            aria-label="Buscar animal"
          />
        </div>
        <button type="submit" className="botao-secundario">
          Buscar
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const ativo = filtro === f.chave;
          const params = new URLSearchParams();
          if (f.chave) params.set('filtro', f.chave);
          if (q) params.set('q', q);
          const qs = params.toString();
          return (
            <Link
              key={f.chave || 'todos'}
              href={qs ? `/animais-ong?${qs}` : '/animais-ong'}
              aria-current={ativo ? 'true' : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                ativo
                  ? 'border-petroleo-800 bg-petroleo-800 text-white'
                  : 'border-tinta-borda bg-white text-tinta-suave hover:border-petroleo-300'
              }`}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </div>

      {animais.length === 0 ? (
        <Vazio
          titulo="Nenhum animal nesta visão"
          descricao="Ajuste o filtro ou cadastre o primeiro animal do abrigo."
          acao={
            <Link href="/animais-ong/novo" className="botao-primario">
              Cadastrar animal
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {animais.map((a) => {
            const custo = calcularCusto(a);
            const status = STATUS_ANIMAL[a.status];
            return (
              <Link key={a.id} href={`/animais-ong/${a.id}`} className="block">
                <Cartao
                  padding={false}
                  className={`h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-flutuante ${
                    a.ativo ? '' : 'opacity-70'
                  }`}
                >
                  <div className="flex gap-3 p-3">
                    <span className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-tinta-borda">
                      <FotoAnimal
                        fotoId={a.fotoCapaId}
                        nome={a.nome}
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-extrabold text-petroleo-900">
                        {a.nome}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-tinta-suave">
                        {formatarIdade(a.dataNascimento, a.idadeAproximada)}
                        {a.raca ? ` · ${a.raca}` : ''}
                      </span>
                      <span className="mt-1.5 block">
                        <Selo classe={status.classe}>
                          {status.ponto} {status.rotulo}
                        </Selo>
                      </span>
                    </span>
                  </div>

                  <div className="border-t border-tinta-borda/70 px-3 py-2.5">
                    <div className="mb-1.5 flex items-baseline justify-between text-xs">
                      <span className="font-bold tabular-nums text-petroleo-800">
                        {porcento(custo.percentual)} apoiado
                      </span>
                      <span className="tabular-nums text-tinta-suave">
                        {reaisCurto(custo.apoiado)} / {reaisCurto(custo.total)}
                      </span>
                    </div>
                    <BarraMeta
                      percentual={custo.percentual}
                      altura="h-2"
                      cor={custo.padrinhos === 0 ? 'petroleo' : 'laranja'}
                      rotulo={`Apoio de ${a.nome}`}
                    />
                    <p className="mt-1.5 text-[11px] text-tinta-clara">
                      {custo.padrinhos === 0
                        ? 'sem padrinho'
                        : `${custo.padrinhos} ${custo.padrinhos === 1 ? 'padrinho' : 'padrinhos'}`}{' '}
                      · resgatado em {formatarData(a.dataResgate)}
                    </p>
                  </div>
                </Cartao>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
