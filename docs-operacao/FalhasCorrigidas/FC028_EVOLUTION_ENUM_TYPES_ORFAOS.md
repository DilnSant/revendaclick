# FC028 — Evolution API: ENUM Types Órfãos após DROP TABLE CASCADE

**Data:** 2026-05-27  
**Sessão:** 13  
**Migration:** 017 (drop_evolution_enum_types_and_fix_prisma_migration)  
**Severidade:** Crítica (container em crash loop — P3009 bloqueando migrate deploy)

---

## Sintoma

Container `rc_evolution` em restart loop com P3009:
```
Database error code: 42710
ERROR: type "InstanceConnectionStatus" already exists
```

---

## Causa Raiz

`DROP TABLE ... CASCADE` remove dependências (foreign keys, indexes, views dependentes), mas **não remove os ENUM types** criados pela migration Prisma. Os 7 tipos abaixo ficaram órfãos no schema `public`:

| Tipo | Criado por |
|------|-----------|
| `InstanceConnectionStatus` | `20240609181238_init` |
| `SessionStatus` | `20240609181238_init` |
| `TriggerType` | migrations posteriores |
| `TriggerOperator` | migrations posteriores |
| `DeviceMessage` | migrations posteriores |
| `DifyBotType` | migrations posteriores |
| `OpenaiBotType` | migrations posteriores |

---

## Correção

Migration 017:
```sql
DROP TYPE IF EXISTS public."DeviceMessage" CASCADE;
DROP TYPE IF EXISTS public."DifyBotType" CASCADE;
DROP TYPE IF EXISTS public."InstanceConnectionStatus" CASCADE;
DROP TYPE IF EXISTS public."OpenaiBotType" CASCADE;
DROP TYPE IF EXISTS public."SessionStatus" CASCADE;
DROP TYPE IF EXISTS public."TriggerOperator" CASCADE;
DROP TYPE IF EXISTS public."TriggerType" CASCADE;

DELETE FROM public."_prisma_migrations" WHERE migration_name = '20240609181238_init';
```

Após a migration, `docker restart rc_evolution` → container atingiu status `healthy` em ~60s e aplicou todas as migrations pendentes com sucesso.

---

## Validação

```bash
# Container healthy
docker ps --filter name=rc_evolution --format '{{.Status}}'
# Up X minutes (healthy)

# API respondendo
curl -s http://localhost:8081/instance/fetchInstances -H "apikey: revendaclick123"
# []   ← vazio é correto (instâncias precisam ser recriadas pelo app)
```

---

## Prevenção

Ao planejar remoção de tabelas gerenciadas por Prisma:

1. **Antes**: listar ENUM types da migration:
   ```sql
   SELECT typname FROM pg_type 
   WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace
   ORDER BY typname;
   ```

2. **Durante**: incluir `DROP TYPE IF EXISTS ... CASCADE` para cada tipo PascalCase

3. **Diagnóstico rápido** se container em crash loop pós-drop:
   ```bash
   docker logs rc_evolution --tail 20 | grep -E "P300[0-9]|42710|already exists"
   ```

**Atenção:** Após recovery, todas as instâncias WhatsApp são perdidas (dados no banco).  
Usuários precisam reconectar em `/whatsapp` → "Conectar WhatsApp" → escanear QR.
