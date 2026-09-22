-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'EQUIPE', 'VETERINARIO', 'PADRINHO');

-- CreateEnum
CREATE TYPE "Especie" AS ENUM ('CANINA', 'FELINA', 'OUTRA');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MACHO', 'FEMEA', 'NAO_INFORMADO');

-- CreateEnum
CREATE TYPE "Porte" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');

-- CreateEnum
CREATE TYPE "StatusAnimal" AS ENUM ('EM_TRATAMENTO', 'DISPONIVEL_ADOCAO', 'EM_PROCESSO_ADOCAO', 'ADOTADO', 'INDISPONIVEL', 'FALECIDO');

-- CreateEnum
CREATE TYPE "TipoMidia" AS ENUM ('FOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "TipoEventoDiario" AS ENUM ('RESGATE', 'CONSULTA', 'TRATAMENTO', 'MELHORA', 'PASSEIO', 'APADRINHAMENTO', 'VACINA', 'CASTRACAO', 'ADOCAO', 'ANIVERSARIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoRegistroSaude" AS ENUM ('CONSULTA', 'VACINA', 'VERMIFUGO', 'CASTRACAO', 'EXAME', 'CIRURGIA', 'MEDICAMENTO', 'PESAGEM', 'ALERGIA', 'DOENCA', 'OUTRO');

-- CreateEnum
CREATE TYPE "ModalidadeApadrinhamento" AS ENUM ('ALIMENTACAO', 'CUIDADOS', 'COMPLETO', 'PERSONALIZADO');

-- CreateEnum
CREATE TYPE "StatusApadrinhamento" AS ENUM ('ATIVO', 'PAUSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusContribuicao" AS ENUM ('PENDENTE', 'PAGA', 'ATRASADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'CARTAO', 'BOLETO', 'TRANSFERENCIA', 'DINHEIRO', 'OUTRO');

-- CreateEnum
CREATE TYPE "OrigemContribuicao" AS ENUM ('APADRINHAMENTO', 'DOACAO_AVULSA', 'CAMPANHA');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('VETERINARIO', 'ALIMENTACAO', 'MEDICAMENTO', 'HIGIENE', 'TRANSPORTE', 'ESTRUTURA', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoComprovante" AS ENUM ('NOTA_FISCAL', 'RECIBO', 'CUPOM', 'CONTRATO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoItemEstoque" AS ENUM ('RACAO', 'MEDICAMENTO', 'HIGIENE', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'PERDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "StatusCampanha" AS ENUM ('RASCUNHO', 'ATIVA', 'CONCLUIDA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "StatusAdocao" AS ENUM ('INTERESSE', 'ENTREVISTA', 'VISITA', 'APROVADA', 'CONCLUIDA', 'RECUSADA', 'DESISTENCIA');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('ATUALIZACAO_ANIMAL', 'APADRINHAMENTO_CONFIRMADO', 'PAGAMENTO_PENDENTE', 'ANIVERSARIO', 'CONQUISTA', 'CAMPANHA', 'ADOCAO', 'OUTRO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'EQUIPE',
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes_login" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "revogadaEm" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessoes_login_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "detalhe" JSONB,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "padrinhos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "documento" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "aceitaNotificacao" BOOLEAN NOT NULL DEFAULT true,
    "perfilPublico" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "padrinhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animais" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" "Especie" NOT NULL DEFAULT 'CANINA',
    "sexo" "Sexo" NOT NULL DEFAULT 'NAO_INFORMADO',
    "porte" "Porte" NOT NULL DEFAULT 'MEDIO',
    "raca" TEXT,
    "pelagem" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "idadeAproximada" TEXT,
    "dataResgate" TIMESTAMP(3) NOT NULL,
    "localResgate" TEXT,
    "historiaResgate" TEXT,
    "personalidade" TEXT,
    "castrado" BOOLEAN NOT NULL DEFAULT false,
    "vacinasEmDia" BOOLEAN NOT NULL DEFAULT false,
    "necessidadeEspecial" BOOLEAN NOT NULL DEFAULT false,
    "descricaoNecessidade" TEXT,
    "status" "StatusAnimal" NOT NULL DEFAULT 'EM_TRATAMENTO',
    "localAbrigo" TEXT,
    "pesoAtualKg" DECIMAL(6,3),
    "custoAlimentacao" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoTratamento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "custoMedicamento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "fotoCapaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),

    CONSTRAINT "animais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoMidia" NOT NULL DEFAULT 'FOTO',
    "arquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "legenda" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_diario" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoEventoDiario" NOT NULL DEFAULT 'OUTRO',
    "data" TIMESTAMP(3) NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "fotoId" TEXT,
    "automatico" BOOLEAN NOT NULL DEFAULT false,
    "interno" BOOLEAN NOT NULL DEFAULT false,
    "autorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_diario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atualizacoes_animal" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "fotoId" TEXT,
    "publica" BOOLEAN NOT NULL DEFAULT false,
    "autorId" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atualizacoes_animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "crmv" TEXT,
    "clinica" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "veterinarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_saude" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoRegistroSaude" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL(10,2),
    "pesoKg" DECIMAL(6,3),
    "proximaData" TIMESTAMP(3),
    "medicamento" TEXT,
    "dosagem" TEXT,
    "veterinarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_saude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apadrinhamentos" (
    "id" TEXT NOT NULL,
    "padrinhoId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "modalidade" "ModalidadeApadrinhamento" NOT NULL DEFAULT 'COMPLETO',
    "valorMensal" DECIMAL(10,2) NOT NULL,
    "status" "StatusApadrinhamento" NOT NULL DEFAULT 'ATIVO',
    "diaVencimento" INTEGER NOT NULL DEFAULT 10,
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fim" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "exibirNoPerfil" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apadrinhamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribuicoes" (
    "id" TEXT NOT NULL,
    "origem" "OrigemContribuicao" NOT NULL DEFAULT 'APADRINHAMENTO',
    "apadrinhamentoId" TEXT,
    "padrinhoId" TEXT,
    "animalId" TEXT,
    "campanhaId" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusContribuicao" NOT NULL DEFAULT 'PENDENTE',
    "metodo" "MetodoPagamento",
    "competencia" TIMESTAMP(3) NOT NULL,
    "vencimento" TIMESTAMP(3),
    "pagoEm" TIMESTAMP(3),
    "referencia" TEXT,
    "observacao" TEXT,
    "anonima" BOOLEAN NOT NULL DEFAULT false,
    "nomeDoador" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contribuicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "despesas" (
    "id" TEXT NOT NULL,
    "categoria" "CategoriaDespesa" NOT NULL,
    "animalId" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "fornecedor" TEXT,
    "registroSaudeId" TEXT,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprovantes" (
    "id" TEXT NOT NULL,
    "despesaId" TEXT NOT NULL,
    "tipo" "TipoComprovante" NOT NULL DEFAULT 'RECIBO',
    "titulo" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "publico" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprovantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_estoque" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoItemEstoque" NOT NULL DEFAULT 'RACAO',
    "unidade" TEXT NOT NULL DEFAULT 'kg',
    "saldo" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "minimo" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_estoque" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "valor" DECIMAL(10,2),
    "fornecedor" TEXT,
    "animalId" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanhas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "animalId" TEXT,
    "resumo" TEXT NOT NULL,
    "texto" TEXT,
    "meta" DECIMAL(10,2) NOT NULL,
    "prazo" TIMESTAMP(3),
    "status" "StatusCampanha" NOT NULL DEFAULT 'RASCUNHO',
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradaEm" TIMESTAMP(3),

    CONSTRAINT "campanhas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adocoes" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "status" "StatusAdocao" NOT NULL DEFAULT 'INTERESSE',
    "adotanteNome" TEXT NOT NULL,
    "adotanteEmail" TEXT,
    "adotanteTelefone" TEXT,
    "adotanteCidade" TEXT,
    "respostas" JSONB,
    "observacoes" TEXT,
    "abertaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidaEm" TIMESTAMP(3),
    "proximoContato" TIMESTAMP(3),

    CONSTRAINT "adocoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "padrinhoId" TEXT NOT NULL,
    "animalId" TEXT,
    "tipo" "TipoNotificacao" NOT NULL DEFAULT 'OUTRO',
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "link" TEXT,
    "lidaEm" TIMESTAMP(3),
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracao_ong" (
    "id" TEXT NOT NULL DEFAULT 'unica',
    "nome" TEXT NOT NULL DEFAULT 'Meu AUmigo',
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "sobre" TEXT,
    "chavePix" TEXT,
    "instagram" TEXT,
    "frase" TEXT NOT NULL DEFAULT 'Você apadrinha. A gente cuida. E um AUmigo ganha uma nova chance.',
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracao_ong_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_papel_ativo_idx" ON "usuarios"("papel", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "sessoes_login_tokenHash_key" ON "sessoes_login"("tokenHash");

-- CreateIndex
CREATE INDEX "sessoes_login_usuarioId_idx" ON "sessoes_login"("usuarioId");

-- CreateIndex
CREATE INDEX "sessoes_login_expiraEm_idx" ON "sessoes_login"("expiraEm");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidade_entidadeId_idx" ON "logs_auditoria"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "logs_auditoria_criadoEm_idx" ON "logs_auditoria"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "padrinhos_usuarioId_key" ON "padrinhos"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "padrinhos_email_key" ON "padrinhos"("email");

-- CreateIndex
CREATE INDEX "padrinhos_nome_idx" ON "padrinhos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "animais_slug_key" ON "animais"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "animais_fotoCapaId_key" ON "animais"("fotoCapaId");

-- CreateIndex
CREATE INDEX "animais_status_ativo_idx" ON "animais"("status", "ativo");

-- CreateIndex
CREATE INDEX "animais_especie_porte_idx" ON "animais"("especie", "porte");

-- CreateIndex
CREATE INDEX "animais_nome_idx" ON "animais"("nome");

-- CreateIndex
CREATE INDEX "fotos_animalId_ordem_idx" ON "fotos"("animalId", "ordem");

-- CreateIndex
CREATE INDEX "eventos_diario_animalId_data_idx" ON "eventos_diario"("animalId", "data");

-- CreateIndex
CREATE INDEX "atualizacoes_animal_animalId_criadaEm_idx" ON "atualizacoes_animal"("animalId", "criadaEm");

-- CreateIndex
CREATE INDEX "registros_saude_animalId_data_idx" ON "registros_saude"("animalId", "data");

-- CreateIndex
CREATE INDEX "registros_saude_tipo_data_idx" ON "registros_saude"("tipo", "data");

-- CreateIndex
CREATE INDEX "registros_saude_proximaData_idx" ON "registros_saude"("proximaData");

-- CreateIndex
CREATE INDEX "apadrinhamentos_padrinhoId_status_idx" ON "apadrinhamentos"("padrinhoId", "status");

-- CreateIndex
CREATE INDEX "apadrinhamentos_animalId_status_idx" ON "apadrinhamentos"("animalId", "status");

-- CreateIndex
CREATE INDEX "contribuicoes_competencia_status_idx" ON "contribuicoes"("competencia", "status");

-- CreateIndex
CREATE INDEX "contribuicoes_animalId_competencia_idx" ON "contribuicoes"("animalId", "competencia");

-- CreateIndex
CREATE INDEX "contribuicoes_padrinhoId_competencia_idx" ON "contribuicoes"("padrinhoId", "competencia");

-- CreateIndex
CREATE INDEX "contribuicoes_status_vencimento_idx" ON "contribuicoes"("status", "vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "despesas_registroSaudeId_key" ON "despesas"("registroSaudeId");

-- CreateIndex
CREATE INDEX "despesas_data_categoria_idx" ON "despesas"("data", "categoria");

-- CreateIndex
CREATE INDEX "despesas_animalId_data_idx" ON "despesas"("animalId", "data");

-- CreateIndex
CREATE INDEX "comprovantes_despesaId_idx" ON "comprovantes"("despesaId");

-- CreateIndex
CREATE INDEX "movimentos_estoque_itemId_data_idx" ON "movimentos_estoque"("itemId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "campanhas_slug_key" ON "campanhas"("slug");

-- CreateIndex
CREATE INDEX "campanhas_status_urgente_idx" ON "campanhas"("status", "urgente");

-- CreateIndex
CREATE INDEX "adocoes_animalId_status_idx" ON "adocoes"("animalId", "status");

-- CreateIndex
CREATE INDEX "adocoes_status_abertaEm_idx" ON "adocoes"("status", "abertaEm");

-- CreateIndex
CREATE INDEX "notificacoes_padrinhoId_lidaEm_idx" ON "notificacoes"("padrinhoId", "lidaEm");

-- AddForeignKey
ALTER TABLE "sessoes_login" ADD CONSTRAINT "sessoes_login_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "padrinhos" ADD CONSTRAINT "padrinhos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_fotoCapaId_fkey" FOREIGN KEY ("fotoCapaId") REFERENCES "fotos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_diario" ADD CONSTRAINT "eventos_diario_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_diario" ADD CONSTRAINT "eventos_diario_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "fotos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_diario" ADD CONSTRAINT "eventos_diario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacoes_animal" ADD CONSTRAINT "atualizacoes_animal_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacoes_animal" ADD CONSTRAINT "atualizacoes_animal_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "fotos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacoes_animal" ADD CONSTRAINT "atualizacoes_animal_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_saude" ADD CONSTRAINT "registros_saude_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_saude" ADD CONSTRAINT "registros_saude_veterinarioId_fkey" FOREIGN KEY ("veterinarioId") REFERENCES "veterinarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apadrinhamentos" ADD CONSTRAINT "apadrinhamentos_padrinhoId_fkey" FOREIGN KEY ("padrinhoId") REFERENCES "padrinhos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apadrinhamentos" ADD CONSTRAINT "apadrinhamentos_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribuicoes" ADD CONSTRAINT "contribuicoes_apadrinhamentoId_fkey" FOREIGN KEY ("apadrinhamentoId") REFERENCES "apadrinhamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribuicoes" ADD CONSTRAINT "contribuicoes_padrinhoId_fkey" FOREIGN KEY ("padrinhoId") REFERENCES "padrinhos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribuicoes" ADD CONSTRAINT "contribuicoes_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribuicoes" ADD CONSTRAINT "contribuicoes_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "campanhas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_registroSaudeId_fkey" FOREIGN KEY ("registroSaudeId") REFERENCES "registros_saude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprovantes" ADD CONSTRAINT "comprovantes_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "despesas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens_estoque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adocoes" ADD CONSTRAINT "adocoes_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_padrinhoId_fkey" FOREIGN KEY ("padrinhoId") REFERENCES "padrinhos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "animais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

