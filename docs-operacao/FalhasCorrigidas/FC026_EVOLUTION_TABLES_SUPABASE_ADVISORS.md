# FC026 — Evolution API Tables no Supabase: Security Advisors

**Data:** 2026-05-27  
**Sessão:** 13  
**Migration:** 015 (drop_evolution_tables_and_security_fixes)  
**Severidade:** Alta (RLS desabilitado em 37 tabelas públicas)

---

## Sintoma

Supabase Security Advisor reportava `rls_disabled_in_public` para 37 tabelas PascalCase:
`Chat`, `Contact`, `Instance`, `Label`, `Media`, `Message`, `MessageUpdate`, `Webhook`, etc.

---

## Causa Raiz

A Evolution API usa Prisma ORM com `EVOLUTION_DATABASE_URL` apontando para o banco Supabase. Ao iniciar pela primeira vez, o Prisma executa `migrate deploy` e cria **todas as suas tabelas no schema `public`** — o mesmo schema do RevendaClick.

Essas tabelas são criadas pelo Prisma sem RLS habilitado (comportamento padrão do Prisma), o que dispara o advisor de segurança do Supabase.

**37 tabelas criadas pelo Prisma (Evolution v2.3.7):**
`Chat`, `ChatUnreadMessages`, `Contact`, `ContactCustomField`, `DelaySetting`, `DifyBot`, `DifySession`, `EvolutionBot`, `EvolutionSession`, `FlowiseBot`, `FlowiseSession`, `GenericBot`, `GenericSession`, `IntegrationSession`, `IsOnWhatsApp`, `Label`, `LabelAssociation`, `Media`, `Message`, `MessageUpdate`, `OpenaiAssistant`, `OpenaiBot`, `OpenaiCreds`, `OpenaiSession`, `Pusher`, `Setting`, `Template`, `Trigger`, `TypebotSession`, `Webhook`...

---

## Correção

Migration 015 removeu todas as tabelas Evolution do schema público:
```sql
DROP TABLE IF EXISTS public."Chat" CASCADE;
-- (37 tabelas no total)
DROP TABLE IF EXISTS public."_prisma_migrations";
```

Também foi removida a view `public_vehicle_listings` (SECURITY DEFINER desnecessária).

---

## Consequência

A remoção das tabelas causou crash da Evolution API (ver FC027 e FC028).

---

## Prevenção

- A Evolution API deveria usar um **schema separado** (`evolution`) em vez do `public`
- Ou usar um banco PostgreSQL dedicado, separado do Supabase do RevendaClick
- Configurar `DATABASE_SCHEMA=evolution` no docker-compose da Evolution impede contaminação do schema público
- **Decisão D19**: documentar no `21_DECISOES_TECNICAS.md` que Evolution tables devem ficar em schema separado em futura refatoração
