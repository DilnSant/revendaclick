# FC027 — Evolution API: Prisma P3005 e P3009 após Drop das Tabelas

**Data:** 2026-05-27  
**Sessão:** 13  
**Migrations:** 016, 017  
**Severidade:** Crítica (container em crash loop)

---

## Sintoma

Após remover as tabelas Evolution do Supabase (migration 015), a Evolution API entrou em crash loop com dois erros sequenciais:

**Erro 1 — P3005:**
```
The database schema is not empty. Read more about how to baseline an existing production database.
```

**Erro 2 — P3009 (após migration 016):**
```
migrate found failed migrations in the target database, new migrations will not be applied:
20240609181238_init — Database error code: 42710
ERROR: type "InstanceConnectionStatus" already exists
```

---

## Causa Raiz

**P3005:** Ao remover `_prisma_migrations`, o Prisma vê o schema `public` não vazio (tabelas RevendaClick existem) mas sem histórico de migrations. Ele recusa executar `migrate deploy` por segurança.

**P3009:** Migration 016 recriou a tabela `_prisma_migrations` vazia. O Prisma tentou aplicar `20240609181238_init` (primeira migration), que executa `CREATE TYPE "InstanceConnectionStatus"`. Porém, `DROP TABLE CASCADE` **não remove ENUM types** criados pela migration — eles persistiram no Postgres. O `CREATE TYPE` falhou com erro 42710 (já existe), deixando um registro com `finished_at = null` na tabela — o que bloqueia todas as migrations futuras.

---

## Correção

**P3005 (migration 016):**
```sql
CREATE TABLE IF NOT EXISTS public."_prisma_migrations" (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY,
  checksum        VARCHAR(64)  NOT NULL,
  finished_at     TIMESTAMPTZ,
  migration_name  VARCHAR(255) NOT NULL,
  logs            TEXT,
  rolled_back_at  TIMESTAMPTZ,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_steps_count INTEGER   NOT NULL DEFAULT 0
);
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
```

**P3009 (migration 017 — ver FC028):**
- Dropar os 7 ENUM types órfãos
- Deletar o registro de migration falha

---

## Prevenção

- `DROP TABLE CASCADE` remove foreign keys e índices dependentes, mas **não remove ENUM types**
- Ao remover tabelas gerenciadas por Prisma/ORM, listar e dropar os tipos customizados separadamente
- Antes de dropar `_prisma_migrations`, verificar se há ENUM types associados: `SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace`
