#!/bin/bash
# ==========================================================
# Gera o PDF da documentação técnica.
#
#   ./docs/gerador/gerar.sh
#
# Depende de: chromium-browser, node 20+, poppler (pdfunite) e ghostscript.
# A capa é impressa em separado — folha inteira, sem cabeçalho nem rodapé —
# e unida ao miolo pelo ghostscript, que é o único dos dois que preserva o
# índice lateral do PDF.
# ==========================================================
set -e
cd "$(dirname "$0")"
RAIZ="$(cd ../.. && pwd)"
PORTA=9333
HTTP=9334
SAIDA="$RAIZ/docs/Meu-AUmigo-Documentacao-Tecnica.pdf"

echo "→ Extraindo trechos do código-fonte..."
./extrair-trechos.sh

echo "→ Montando o HTML..."
python3 gerar.py

# O Chromium desta VPS é um snap: o AppArmor o impede de abrir file:// fora
# de $HOME, e /opt está fora. Servir por HTTP local resolve sem depender de
# onde o projeto está instalado.
echo "→ Servindo as páginas em http://127.0.0.1:$HTTP ..."
python3 -m http.server "$HTTP" --bind 127.0.0.1 --directory "$PWD" > /dev/null 2>&1 &
SERVIDOR=$!

echo "→ Subindo o Chromium headless..."
PERFIL=$(mktemp -d)
chromium-browser --headless --disable-gpu --no-sandbox --disable-dev-shm-usage \
  --user-data-dir="$PERFIL" --remote-debugging-port=$PORTA about:blank \
  > /tmp/chromium-doc.log 2>&1 &
CHROME=$!
trap 'kill $CHROME $SERVIDOR 2>/dev/null; rm -rf "$PERFIL"' EXIT

for _ in $(seq 20); do
  curl -sf -m 2 "http://127.0.0.1:$PORTA/json/version" > /dev/null && break
  sleep 1
done

echo "→ Imprimindo..."
node --experimental-websocket imprimir-capa.mjs "http://127.0.0.1:$HTTP/capa.html" "$PWD/_capa.pdf"
node --experimental-websocket imprimir.mjs "http://127.0.0.1:$HTTP/documentacao.html" "$PWD/_miolo.pdf" "Meu AUmigo"

echo "→ Unindo capa e miolo..."
gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress \
   -dCompatibilityLevel=1.7 -sOutputFile="$SAIDA" _capa.pdf _miolo.pdf
rm -f _capa.pdf _miolo.pdf

echo "✓ $SAIDA"
