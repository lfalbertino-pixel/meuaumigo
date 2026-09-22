# Gerador da documentação técnica

Produz `docs/Meu-AUmigo-Documentacao-Tecnica.pdf` — 64 páginas, com sumário
clicável e índice lateral.

```bash
./docs/gerador/gerar.sh
```

## Como está organizado

| Arquivo | Papel |
|---|---|
| `partes/*.html` | O texto do documento, uma parte por arquivo. É aqui que se escreve. |
| `extrair-trechos.sh` | Recorta do código-fonte os blocos que aparecem no PDF. |
| `gerar.py` | Junta as partes, expande os `{{cod:...}}` e monta o sumário automático. |
| `estilo.css` | Folha de estilo de impressão (A4, mm/pt). |
| `imprimir.mjs` | Imprime o miolo pelo DevTools Protocol, com numeração de páginas. |
| `imprimir-capa.mjs` | Imprime a capa em folha inteira, sem cabeçalho nem rodapé. |
| `trechos/` | Gerado. Não editar à mão. |

## A regra que sustenta o documento

**Nenhum trecho de código é digitado no texto.** Eles são referenciados por
`{{cod:nome|linguagem|legenda}}` e extraídos do código-fonte a cada geração.
Documentação com código copiado à mão envelhece em uma semana e ninguém
percebe.

Se um trecho sair vazio, `extrair-trechos.sh` falha com a lista dos arquivos
vazios — sinal de que a função referenciada mudou de nome ou de assinatura.

## Sumário e numeração

O sumário é montado a partir dos `<h2 id>` e `<h3 id>` na ordem em que
aparecem; a numeração vem do `<span class="num">` de cada título. Para incluir
uma seção nova, basta dar a ela um `id` e um número.

A capa não é numerada — convenção de documento impresso. O miolo conta as
próprias 63 páginas.
