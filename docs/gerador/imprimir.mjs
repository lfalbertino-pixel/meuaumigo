/**
 * Imprime um HTML local em PDF usando o Chromium headless pelo DevTools
 * Protocol. O `--print-to-pdf` da linha de comando não deixa controlar
 * cabeçalho e rodapé; pelo CDP, sim — e é de lá que sai a numeração de
 * páginas real ("página 12 de 58").
 *
 * Node 20 só expõe WebSocket com --experimental-websocket.
 */
import { writeFileSync } from 'node:fs';

const [, , url, pdfPath, titulo] = process.argv;
if (!url || !pdfPath) {
  console.error('uso: node --experimental-websocket imprimir.mjs <url> <pdf> [titulo]');
  process.exit(1);
}

const PORTA = 9333;

async function alvo() {
  const r = await fetch(`http://127.0.0.1:${PORTA}/json/list`);
  const abas = await r.json();
  const pagina = abas.find((a) => a.type === 'page');
  if (!pagina) throw new Error('nenhuma aba disponível');
  return pagina.webSocketDebuggerUrl;
}

const ws = new WebSocket(await alvo());
let proximoId = 1;
const pendentes = new Map();
const ouvintes = new Map();

function enviar(metodo, params = {}) {
  const id = proximoId++;
  ws.send(JSON.stringify({ id, method: metodo, params }));
  return new Promise((resolve, reject) => pendentes.set(id, { resolve, reject }));
}

function esperarEvento(nome) {
  return new Promise((resolve) => ouvintes.set(nome, resolve));
}

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pendentes.has(msg.id)) {
    const { resolve, reject } = pendentes.get(msg.id);
    pendentes.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  } else if (msg.method && ouvintes.has(msg.method)) {
    ouvintes.get(msg.method)(msg.params);
    ouvintes.delete(msg.method);
  }
});

await new Promise((resolve) => ws.addEventListener('open', resolve));

await enviar('Page.enable');
const carregou = esperarEvento('Page.loadEventFired');
await enviar('Page.navigate', { url });
await carregou;

// A fonte, as imagens e o layout precisam assentar antes de medir as
// quebras de página; sem esta folga a última seção sai cortada.
await new Promise((r) => setTimeout(r, 2500));

const estilo =
  'font-family: -apple-system, system-ui, sans-serif; font-size: 7.5pt; color: #8c9895; width: 100%; padding: 0 14mm;';

const { data } = await enviar('Page.printToPDF', {
  printBackground: true,
  preferCSSPageSize: false,
  // Gera o índice lateral do PDF a partir dos h1-h6: num documento de 60
  // páginas, navegar por rolagem não é opção.
  generateDocumentOutline: true,
  paperWidth: 8.27,
  paperHeight: 11.69,
  marginTop: 0.75,
  marginBottom: 0.7,
  marginLeft: 0,
  marginRight: 0,
  displayHeaderFooter: true,
  headerTemplate: `<div style="${estilo} display:flex; justify-content:space-between;">
      <span>${titulo ?? ''}</span><span>Documentação técnica</span></div>`,
  footerTemplate: `<div style="${estilo} display:flex; justify-content:space-between;">
      <span>Meu AUmigo · uso interno</span>
      <span>página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
});

writeFileSync(pdfPath, Buffer.from(data, 'base64'));
console.log(`✓ ${pdfPath}`);
ws.close();
process.exit(0);
