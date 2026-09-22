# Operação — Meu AUmigo

Notas de quem vai manter isto rodando nesta VPS.

## Onde as coisas estão

| Item | Valor |
|---|---|
| Porta publicada | `1046` (via `APP_PORT`) |
| Container | `meuaumigo-app` |
| Imagem | `meuaumigo:latest` |
| Rede / subnet | `meuaumigo-net` / `172.16.61.0/24` (fixa) |
| Volume de mídia | `meuaumigo_midia` → `/app/storage` |
| Banco | `meuaumigo` no PostgreSQL do **host** |
| Papéis | `meuaumigo_app` (DML) e `meuaumigo_owner` (schema) |

Não há proxy reverso nesta máquina: o Cloudflare Tunnel aponta para
`http://localhost:1046`.

## Os três erros recorrentes desta VPS

**1. O container sobe mas não conecta no banco (`P1001`).**
De dentro do container, o Postgres do host é `host.docker.internal`, nunca
`localhost`. Confira o `.env`:

```bash
docker compose exec app printenv DATABASE_URL
```

**2. A porta 5432 não está liberada para a rede do container.**

```bash
ufw status | grep 172.16.61
# se não aparecer:
ufw allow from 172.16.61.0/24 to any port 5432 proto tcp comment 'meuaumigo docker network'
```

**3. A subnet mudou ao recriar a rede.**
Ela está fixa no `docker-compose.yml` (`ipam.config.subnet`). Se alguém remover
essa fixação, o Docker sorteia outra faixa e a regra de ufw para de valer —
silenciosamente, só na próxima recriação.

## Backup

Duas coisas, e as duas têm a mesma prioridade:

```bash
# banco
pg_dump -h localhost -U meuaumigo_owner meuaumigo | gzip > meuaumigo-$(date +%F).sql.gz

# mídia (fotos dos animais e comprovantes de despesa)
docker run --rm -v meuaumigo_midia:/dados -v "$PWD":/saida alpine \
  tar czf /saida/meuaumigo-midia-$(date +%F).tar.gz -C /dados .
```

A foto do animal é metade da captação da ONG. Um banco restaurado sem as fotos
devolve um sistema que ninguém quer usar.

## Fuso horário

O compose define `TZ=America/Sao_Paulo`. Sem isso a imagem base roda em UTC e a
competência da mensalidade, a data do resgate e o "arrecadado este mês" saem três
horas adiantados — e no dia 1 isso muda o mês inteiro de lugar.

## Rotina mensal da equipe

Não há agendador nesta máquina. Quem dispara a cobrança é a equipe, em
`/financeiro`:

1. **Gerar mensalidades do mês** — cria um lançamento pendente por apadrinhamento
   ativo. É idempotente: pode ser clicado duas vezes sem duplicar nada.
2. **Marcar vencidas como atrasadas** — move o que passou do vencimento.
3. Conferir o extrato e confirmar os pagamentos um a um.

## Deploy de uma alteração

```bash
cd /srv/meuaumigo   # o diretório onde o projeto foi clonado
docker compose build
docker compose up -d
docker compose logs -f app
```

O entrypoint roda `migrate deploy` e reaplica os GRANTs a cada subida. A semente
de demonstração não roda se já houver animal cadastrado.

## Destrancando o acesso

Se ninguém conseguir entrar (admin desativado por engano, senha perdida):

```bash
docker compose exec app node_modules/.bin/tsx scripts/criar-usuario.ts \
  "Nome da Pessoa" email@ong.com.br senhaSegura ADMIN
```

Reativa a conta junto, porque quem roda isto quase sempre está destrancando a
porta.

## Healthcheck

`/api/health` bate no banco de propósito: um container que responde 200 sem
conseguir ler o Postgres do host está "no ar" e inútil — e é justamente esse o
modo de falha desta máquina.
