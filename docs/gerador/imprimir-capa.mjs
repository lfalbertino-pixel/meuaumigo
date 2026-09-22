/** Imprime a capa: folha inteira, sem cabeçalho, rodapé nem margem. */
import { writeFileSync } from 'node:fs';
const [, , url, pdfPath] = process.argv;
// O Chromium desta máquina é um snap, e o AppArmor o impede de ler file://
// fora de $HOME. Por isso as páginas são servidas por HTTP local — e por isso
// vale conferir que a URL responde antes de imprimir a página de erro do
// próprio navegador como se fosse a capa.
const teste = await fetch(url).catch(() => null);
if (!teste?.ok) {
  console.error(`capa inacessível: ${url}`);
  process.exit(1);
}
const PORTA = 9333;

const abas = await (await fetch(`http://127.0.0.1:${PORTA}/json/list`)).json();
const ws = new WebSocket(abas.find((a) => a.type === 'page').webSocketDebuggerUrl);
let id = 1;
const pend = new Map(), ouv = new Map();
const cmd = (m, p = {}) => (ws.send(JSON.stringify({ id: id, method: m, params: p })),
  new Promise((res, rej) => pend.set(id++, { res, rej })));
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id);
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  else if (m.method && ouv.has(m.method)) { ouv.get(m.method)(); ouv.delete(m.method); }
});
await new Promise((r) => ws.addEventListener('open', r));
await cmd('Page.enable');
const carregou = new Promise((r) => ouv.set('Page.loadEventFired', r));
await cmd('Page.navigate', { url });
await carregou;
await new Promise((r) => setTimeout(r, 2000));
const { data } = await cmd('Page.printToPDF', {
  printBackground: true, paperWidth: 8.27, paperHeight: 11.69,
  marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
  displayHeaderFooter: false,
});
writeFileSync(pdfPath, Buffer.from(data, 'base64'));
console.log(`✓ ${pdfPath}`);
process.exit(0);
