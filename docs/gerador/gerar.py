#!/usr/bin/env python3
"""
Monta o HTML da documentação a partir dos arquivos em partes/ e dos
trechos de código reais extraídos do projeto.

Os trechos NÃO são digitados à mão no documento: vêm de trechos/*.txt,
que por sua vez saíram do código-fonte com sed/awk. Documentação com
código copiado à mão envelhece em uma semana e ninguém percebe.
"""
import html
import pathlib
import re
import sys

BASE = pathlib.Path(__file__).parent
TRECHOS = BASE / 'trechos'
PARTES = BASE / 'partes'

ORDEM = [
    'sumario-marcador', 'produto', 'arquitetura', 'dados',
    'regras', 'seguranca', 'interface', 'ia', 'infra', 'semente',
    'operacao', 'apendices',
]


def bloco_codigo(nome: str, lang: str = '', legenda: str = '') -> str:
    arquivo = TRECHOS / f'{nome}.txt'
    if not arquivo.exists():
        raise SystemExit(f'trecho ausente: {nome}')
    codigo = arquivo.read_text().rstrip('\n')
    linhas = codigo.split('\n')
    numeradas = ''.join(
        f'<span class="linha"><span class="ln">{i}</span>'
        f'<span class="txt">{html.escape(l) or "&nbsp;"}</span></span>'
        for i, l in enumerate(linhas, 1)
    )
    cap = f'<figcaption>{html.escape(legenda)}</figcaption>' if legenda else ''
    return f'<figure class="codigo {lang}">{cap}<pre><code>{numeradas}</code></pre></figure>'


def expandir(texto: str) -> str:
    def troca(m):
        partes = m.group(1).split('|')
        nome = partes[0]
        lang = partes[1] if len(partes) > 1 else ''
        legenda = partes[2] if len(partes) > 2 else ''
        return bloco_codigo(nome, lang, legenda)

    return re.sub(r'\{\{cod:([^}]+)\}\}', troca, texto)


def montar_sumario(corpo: str) -> str:
    """Sumário automático: qualquer h2/h3 com id entra, na ordem em que aparece."""
    itens = re.findall(
        r'<h([23]) id="([^"]+)"[^>]*>(?:<span class="num">([^<]*)</span>\s*)?(.*?)</h\1>',
        corpo,
        re.S,
    )
    linhas = []
    for nivel, ident, num, titulo in itens:
        limpo = re.sub(r'<[^>]+>', '', titulo).strip()
        linhas.append(
            f'<li class="n{nivel}"><a href="#{ident}">'
            f'<span class="s-num">{num.strip()}</span>'
            f'<span class="s-titulo">{limpo}</span></a></li>'
        )
    return '<ol class="sumario">' + '\n'.join(linhas) + '</ol>'


def main() -> None:
    partes = []
    for nome in ORDEM:
        arquivo = PARTES / f'{nome}.html'
        if nome == 'sumario-marcador':
            partes.append('<!--SUMARIO-->')
            continue
        if not arquivo.exists():
            print(f'  aviso: parte ausente — {nome}', file=sys.stderr)
            continue
        partes.append(expandir(arquivo.read_text()))

    corpo = '\n'.join(partes)
    sumario_html = (
        '<section class="pagina sumario-pagina">'
        '<h1 class="titulo-parte">Sumário</h1>'
        + montar_sumario(corpo)
        + '</section>'
    )
    corpo = corpo.replace('<!--SUMARIO-->', sumario_html)

    estilo = (BASE / 'estilo.css').read_text()
    saida = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Meu AUmigo — Documentação Técnica</title>
<style>{estilo}</style>
</head>
<body>
{corpo}
</body>
</html>"""

    destino = BASE / 'documentacao.html'
    destino.write_text(saida)

    # A capa é um documento à parte: imprime em folha inteira, sem cabeçalho
    # nem rodapé, e só depois é unida ao miolo.
    capa = (PARTES / 'capa.html').read_text().replace('logo.png', 'logo-capa.png')
    (BASE / 'capa.html').write_text(
        '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
        f'<title>Meu AUmigo</title><style>{estilo}</style></head>'
        f'<body>{capa}</body></html>'
    )
    n_secoes = saida.count('<h2 id=')
    print(f'✓ {destino}  ({len(saida) // 1024} kB, {n_secoes} seções)')


if __name__ == '__main__':
    main()
