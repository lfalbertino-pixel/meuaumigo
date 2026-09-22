#!/bin/bash
# ==========================================================
# Extrai do código-fonte os trechos que aparecem no PDF.
#
# Os blocos de código da documentação NÃO são digitados à mão: saem daqui.
# Documentação com código copiado à mão envelhece em uma semana e ninguém
# percebe — este script é o que mantém a promessa de que o que está no PDF
# é o que está rodando.
# ==========================================================
set -e
cd "$(dirname "$0")/../.."          # raiz do projeto
S="docs/gerador/trechos"
mkdir -p "$S"

# Bloco delimitado por duas expressões regulares (início e fim, inclusive).
entre() {
  awk -v ini="$3" -v f="$4" '
    !dentro && $0 ~ ini { dentro = 1 }
    dentro { print; if ($0 ~ f && linhas > 0) exit; linhas++ }
  ' "$2" > "$S/$1.txt"
}

entre calcular-custo        src/server/custos.ts        '^export function calcularCusto' '^}'
entre ratear                src/server/custos.ts        '^export async function ratearContribuicao' '^}'
entre env                   src/lib/env.ts              '^const schema = z.object' '^});'
entre ler-sessao            src/lib/auth.ts             'export const lerSessao' '^});'
entre csrf                  src/lib/auth.ts             '^export async function conferirMesmaOrigem' '^}'
entre schema-animal         prisma/schema.prisma        '^model Animal .$' '^.$'
entre schema-contribuicao   prisma/schema.prisma        '^model Contribuicao .$' '^.$'
entre gamificacao           src/server/gamificacao.ts   '^export function calcularConquistas' '^}'
entre ia-instrucao          src/server/ia/assistente.ts '^const INSTRUCAO' '^- Seja curto'
entre gerar-mensalidades    'src/app/(ong)/financeiro/actions.ts' '^export async function gerarMensalidades' '^}'

# Transações e blocos internos
awk '/await db.\$transaction\(async \(tx\) => \{/,/^  \}\);/' \
  'src/app/(publico)/animais/[slug]/apadrinhar/actions.ts' > "$S/apadrinhar-transacao.txt"
awk '/await db.\$transaction\(async \(tx\) => \{/,/^  \}\);/' \
  'src/app/(ong)/saude/actions.ts' > "$S/saude-transacao.txt"
awk '/await db.\$transaction\(async \(tx\) => \{/,/^  \}\);/' \
  'src/app/(ong)/adocoes/actions.ts' > "$S/adocao-transacao.txt"
awk '/const saldoAtual/,/^  \}\);/' \
  'src/app/(ong)/alimentacao/actions.ts' > "$S/estoque-delta.txt"
awk '/const jaTemAnimal/,/^  \}$/' prisma/seed.ts | head -20 > "$S/seed-salvaguarda.txt"
awk '/^export async function montarContexto/,/^  \]\)/' \
  src/server/ia/contexto.ts | head -34 > "$S/ia-contexto.txt"

# Arquivos inteiros e faixas
cp docker-entrypoint.sh  "$S/entrypoint.txt"
cp prisma/sql/grants.sql "$S/grants.txt"
sed -n '/^export const CORES/,$p' src/lib/paleta.ts > "$S/paleta.txt"
sed -n "$(grep -n '^networks:' docker-compose.yml | cut -d: -f1),\$p" docker-compose.yml > "$S/compose-rede.txt"
sed -n "$(grep -n 'AS runner' Dockerfile | cut -d: -f1),\$p" Dockerfile > "$S/dockerfile-runner.txt"
sed -n "$(grep -n 'petroleo: {' tailwind.config.ts | cut -d: -f1),$(( $(grep -n 'laranja: {' tailwind.config.ts | cut -d: -f1) + 11 ))p" \
  tailwind.config.ts > "$S/tailwind-cores.txt"

vazios=$(find "$S" -name '*.txt' -empty | wc -l)
echo "✓ $(ls "$S" | wc -l) trechos extraídos${vazios:+, $vazios vazio(s)}"
[ "$vazios" -eq 0 ] || { find "$S" -name '*.txt' -empty; exit 1; }

# Arte da capa: só o cachorro e o coração, recortados da logo oficial.
convert public/marca/meuaumigo-logo.png -crop 100%x53%+0+0 +repage -trim +repage \
        -resize 620x620 -background none -gravity center -extent 640x520 \
        docs/gerador/logo-capa.png
