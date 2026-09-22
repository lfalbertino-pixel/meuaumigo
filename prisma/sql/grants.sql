-- ==========================================================
-- GRANTs do papel da aplicação.
--
-- Roda a cada deploy, com o papel DONO, logo depois das migrations.
-- Idempotente de propósito: tabela criada por migration futura já nasce
-- acessível à app, e se alguém afrouxar a muralha à mão, o próximo
-- deploy a reafirma.
--
-- `meuaumigo_app` NUNCA recebe CREATE/ALTER/DROP: a aplicação não pode
-- alterar o próprio schema.
-- ==========================================================

GRANT USAGE ON SCHEMA public TO meuaumigo_app;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public TO meuaumigo_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO meuaumigo_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO meuaumigo_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO meuaumigo_app;

-- O histórico de migrations é do dono.
REVOKE ALL ON TABLE "_prisma_migrations" FROM meuaumigo_app;

-- Auditoria é append-only, nem para a app. Sistema que administra
-- dinheiro de terceiro precisa de log que ele próprio não reescreva.
REVOKE UPDATE, DELETE ON TABLE "logs_auditoria" FROM meuaumigo_app;
