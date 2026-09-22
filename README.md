# Meu AUmigo 🐾

> Você apadrinha. A gente cuida. E um AUmigo ganha uma nova chance.

Sistema de apadrinhamento, cuidado e adoção de animais resgatados. Não é um
controle de doações: é um sistema para mostrar ao padrinho **o impacto que o
dinheiro dele está causando na vida de um animal específico**. Essa frase decide
todas as escolhas de produto daqui.

O ciclo que ele gerencia, inteiro:

```
Resgate → Tratamento → Apadrinhamento → Acompanhamento → Adoção
```

---

## As três áreas

| Área | Quem usa | O que faz |
|---|---|---|
| **Site público** | qualquer pessoa | vitrine de animais com filtros, perfil de cada um com história e meta, campanhas de emergência, prestação de contas |
| **Área do padrinho** | quem apadrinha | "como o Thor está?", diário do animal, para onde foi o dinheiro dele neste mês, tempo de amizade |
| **Administração** | equipe da ONG | painel, animais, saúde, alimentação, financeiro, campanhas, adoções, relatórios e o assistente de IA |

### Rotas

**Público** — `/` · `/animais` · `/animais/[slug]` · `/animais/[slug]/apadrinhar`
· `/campanhas` · `/campanhas/[slug]` · `/adotar/[slug]` · `/impacto`

**Padrinho** — `/meus-aumigos` · `/meus-aumigos/[slug]` · `/meus-aumigos/contribuicoes`
· `/meus-aumigos/conquistas`

**ONG** — `/painel` · `/animais-ong` · `/apadrinhamentos` · `/padrinhos` · `/saude`
· `/alimentacao` · `/financeiro` · `/campanhas-ong` · `/adocoes` · `/relatorios`
· `/ia` · `/configuracoes`

---

## Decisões que valem entender antes de mexer

**O custo mensal do animal é estimativa, não gasto real.** Os campos
`custoAlimentacao`, `custoTratamento` e `custoMedicamento` são a meta pública. O
gasto de verdade vive em `Despesa`. Isso é proposital: o apadrinhamento é
recorrente e precisa de alvo estável — um mês com cirurgia não pode fazer a meta
do Thor saltar de R$ 500 para R$ 3.000 na página pública. Para isso existe
campanha de emergência.

**O financeiro fecha por competência, não por data de pagamento.** Quem paga
setembro no dia 3 de outubro pagou setembro. Despesa, ao contrário, conta pela
data do lançamento.

**Nada entra como pago sem alguém conferir.** Não há gateway de pagamento
integrado. Apadrinhamento e doação nascem `PENDENTE`; a equipe confirma olhando o
extrato. Inventar um "pago" que ninguém verificou estragaria justamente o número
que a página de transparência mostra.

**O slug do animal nunca muda.** É o link que já circulou no WhatsApp. Renomear o
animal não renomeia a URL.

**A aplicação não pode alterar o próprio schema.** Dois papéis no banco:
`meuaumigo_app` só tem DML; `meuaumigo_owner` é dono e só o entrypoint o usa,
para `migrate deploy` e GRANTs. A tabela de auditoria é append-only até para a
app.

**A IA nunca é caminho crítico.** Sem `ANTHROPIC_API_KEY`, a tela `/ia` mostra
"não configurado" e todo o resto funciona igual. Ela recebe um resumo agregado
dos dados — nome, e-mail e telefone de padrinho não saem daqui.

---

## Rodando

Pré-requisitos: Docker e o PostgreSQL do **host** (fora do compose, porta 5432).

```bash
cp .env.example .env     # preencha DATABASE_URL e DATABASE_URL_OWNER
docker compose up -d --build
```

O entrypoint aplica as migrations com o papel dono, reafirma os GRANTs e roda a
semente. Sobe em `http://localhost:${APP_PORT:-1046}`.

### Banco (uma vez, no host)

```sql
CREATE ROLE meuaumigo_owner LOGIN PASSWORD '...';
CREATE ROLE meuaumigo_app   LOGIN PASSWORD '...';
CREATE DATABASE meuaumigo OWNER meuaumigo_owner;
REVOKE ALL ON DATABASE meuaumigo FROM PUBLIC;
GRANT CONNECT ON DATABASE meuaumigo TO meuaumigo_app;
-- conectado em meuaumigo:
ALTER SCHEMA public OWNER TO meuaumigo_owner;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

E libere a subnet do compose no firewall — sem isso o container não alcança o
Postgres do host:

```bash
ufw allow from 172.16.61.0/24 to any port 5432 proto tcp comment 'meuaumigo docker network'
```

A subnet é **fixa** no `docker-compose.yml` justamente por causa dessa regra: sem
fixar, o Docker sorteia outra faixa ao recriar e a liberação para de valer.

---

## Dados fictícios

O sistema vai para a mão da equipe antes de existir dado verdadeiro, e painel
vazio não ensina nada. A semente cria 12 meses de história fictícia: ~96 animais,
~148 padrinhos, ~205 apadrinhamentos, ~1.200 contribuições, ~790 despesas, saúde,
estoque, campanhas e adoções.

Duas salvaguardas:

1. **Se já houver qualquer animal cadastrado, a semente não roda.** Dado real
   nunca é sobrescrito.
2. `SEMEAR_DEMONSTRACAO=false` desliga de vez — é o interruptor a virar no dia em
   que o primeiro animal de verdade for cadastrado.

Acessos criados pela semente:

| E-mail | Papel |
|---|---|
| `admin@meuaumigo.com.br` | direção — vê financeiro e configurações |
| `rita@meuaumigo.com.br` | equipe |
| `padrinho@meuaumigo.com.br` | área do padrinho |

A senha dos três vem de `SENHA_DEMO` no `.env`. Deixando a variável em branco,
a semente sorteia uma e a imprime no log do boot:

```bash
docker compose logs app | grep -i senha
```

> **Troque as senhas antes de expor o sistema.** E não escreva uma senha no
> `.env.example` — ele é versionado.

---

## Comandos

```bash
docker compose logs -f app                  # acompanhar
docker compose exec app node_modules/.bin/tsx scripts/criar-usuario.ts "Nome" email@ong.com.br senha ADMIN
npm run typecheck                           # tipos
npm run build                               # build local
```

## Stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind ·
Prisma + PostgreSQL · argon2 · Anthropic SDK (opcional).

Gráficos são SVG escritos à mão, sem biblioteca: são quatro formas, e qualquer
pacote do mercado traria dezenas de kB para o celular de quem só quer ver quanto
entrou no mês. A paleta passou pelo validador de contraste e daltonismo, e todo
gráfico traz legenda em texto e tabela equivalente — cor nunca é a única forma de
ler um número.
