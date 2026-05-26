# 19 — RISCOS

> Riscos mapeados a partir da leitura do código real, infraestrutura e banco de dados.

---

## Riscos Críticos (impacto imediato em produção)

### R1 — Remoção de `evolution_instances` volume

**O que é:** Volume Docker com estado das instâncias WhatsApp.
**Impacto:** Todos os tenants perdem a conexão WhatsApp. Precisam reconectar via QR code.
**Como acontece:** `docker compose down -v` ou remoção manual do volume.
**Mitigação:** Nunca usar `docker compose down -v` em produção. Listar volumes antes de qualquer operação destrutiva.

---

### R2 — ASAAS_WEBHOOK_TOKEN divergente

**O que é:** Token configurado no `.env` deve ser idêntico ao configurado no painel Asaas.
**Impacto:** Todos os webhooks de pagamento retornam 401. Assinaturas não são ativadas. Clientes pagam e não recebem acesso.
**Como acontece:** Rotação de token sem atualizar no Asaas dashboard.
**Mitigação:** Ao alterar `ASAAS_WEBHOOK_TOKEN`, atualizar imediatamente no Asaas → Integrações → Webhooks.

---

### R3 — Porta errada em `EVOLUTION_DATABASE_URL`

**O que é:** Evolution usa Prisma que requer advisory locks — incompatível com PgBouncer (porta 6543).
**Impacto:** Evolution não inicia. Todos os tenants sem WhatsApp.
**Como acontece:** Trocar por acidente para porta 6543 (transaction mode).
**Mitigação:** `EVOLUTION_DATABASE_URL` sempre porta 5432 (session mode). `DATABASE_URL` sempre porta 6543 (transaction mode). Nunca trocar.

---

### R4 — Desativação do RLS em qualquer tabela

**O que é:** Row Level Security obrigatório em todas as tabelas de negócio.
**Impacto:** Cross-tenant data exposure — um tenant vê dados de todos os outros.
**Como acontece:** `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` por engano ou "para teste".
**Mitigação:** Nunca desativar RLS. Para debug, usar service role key com cuidado e reativar imediatamente.

---

### R5 — Commit de `.env` no repositório

**O que é:** Arquivo `.env` de produção contém chaves do Supabase, Asaas, Evolution.
**Impacto:** Exposição total das credenciais de produção.
**Como acontece:** `git add .` sem verificar `.gitignore`.
**Mitigação:** `.gitignore` já inclui `.env*`. Verificar sempre com `git status` antes de commit.

---

## Riscos Altos (impacto em funcionalidade)

### R6 — Runner GitHub Actions parado

**O que é:** O runner de CI/CD fica no próprio VPS Hostinger.
**Impacto:** Todo deploy automático para de funcionar silenciosamente.
**Como detectar:** CI fica em "queued" por mais de 5 minutos.
**Solução:** `sudo systemctl restart actions.runner.*` no VPS.

---

### R7 — Certificado SSL expirado

**O que é:** Let's Encrypt via Certbot com renovação automática.
**Impacto:** Site fora do ar (SSL error para todos usuários).
**Como acontece:** Timer de renovação falhou, VPS reiniciou sem restaurar o timer.
**Solução:** `sudo certbot renew --nginx --force-renewal`.

---

### R8 — Backend não inicializa sem variáveis obrigatórias

**O que é:** `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` são obrigatórias.
**Impacto:** Backend não sobe. API retorna 502.
**Como acontece:** Variável ausente no `.env` do VPS após redeployment.
**Mitigação:** Sempre verificar health endpoint após deploy.

---

### R9 — Limit de plano não respeita plano atual

**O que é:** Triggers `check_vehicle_limit()` e `check_user_limit()` consultam o plano via JOIN.
**Impacto:** Tenants podem ultrapassar limites se a consulta falhar.
**Como acontece:** Alteração nas tabelas `plans` ou `subscriptions` sem atualizar triggers.
**Mitigação:** Testar triggers após qualquer migração que altere `plans` ou `subscriptions`.

---

### R10 — Grace period não aplicado

**O que é:** Trigger `set_subscription_grace` aplica `grace_until = NOW() + 3 days` quando status → `past_due`.
**Impacto:** Tenant bloqueado imediatamente ao atrasar pagamento (sem os 3 dias de grace).
**Como acontece:** Trigger removido ou com bug.
**Mitigação:** Testar trigger após qualquer migração que toque em `subscriptions`.

---

## Riscos Médios (impacto em UX/performance)

### R11 — PgBouncer connection pool esgotado

**O que é:** Backend usa MaxConns=10 com statement_timeout=10s.
**Impacto:** Novas requisições ficam em espera ou falham.
**Como detectar:** `db_pool_wait_count` crescendo nos logs/métricas.
**Solução:** Aumentar MaxConns em `backend/internal/db/db.go` (respeitando limite do Supabase tier).

---

### R12 — OpenRouter com chave inválida

**O que é:** Se `OPENROUTER_API_KEY` estiver vazia, IA é desabilitada com log de warning.
**Impacto:** `/api/ai/*` retorna 500.
**Solução:** Configurar `OPENROUTER_API_KEY` no `.env`.

---

### R13 — Memory limit do Evolution atingido

**O que é:** Evolution tem limite de 768m em produção (aumentado de 512m em 25/05/2026).
**Mitigação ativa:** `NODE_OPTIONS=--max-old-space-size=400` limita o heap do Node.js a 400m, dando margem de segurança antes de atingir 768m. Redis cache reduz pressão de memória.
**Impacto:** OOM Killer mata o container. Tenants perdem WhatsApp temporariamente.
**Como detectar:** `docker stats` mostrando Evolution próximo de 768m.
**Solução:** Aumentar limite no `docker-compose.production.yml` para 1024m (se VPS tiver memória).

---

### R14 — Nginx cache retornando dados desatualizados

**O que é:** `/api/public/*` tem cache de 60s no Nginx.
**Impacto:** Vitrine pública exibe dados antigos por até 60 segundos após atualização.
**Quando acontece:** Normal e esperado — é o comportamento de cache.
**Solução aceitável:** Documentar para o cliente. Reduzir TTL se necessário.

---

### R15 — updateSupabaseAppMetadata falha silenciosa no onboarding

**O que é:** `POST /api/onboarding/setup` cria o tenant no banco (transação OK), depois chama `updateSupabaseAppMetadata` para gravar `tenant_id` + `user_role` em `auth.users.raw_app_meta_data`. Se essa chamada falhar, o backend retorna 201 normalmente — mas o JWT emitido nunca carrega o claim.
**Impacto:** Novo usuário faz onboarding, o formulário parece ter funcionado, mas no redirecionamento para /dashboard o `getTenantForUser` com RLS retorna null e redireciona de volta para /onboarding. Sintoma: formulário limpa e "nada acontece".
**Mitigação ativa:** `getTenantForUser` tem fallback via service role (procura por `id = userId`), então o usuário chega ao dashboard mesmo sem o JWT claim. Porém, features que dependem de `auth_tenant_id()` diretamente no Supabase (Storage RLS, por exemplo) podem não funcionar corretamente.
**Como diagnosticar:** Ver logs do backend: `docker compose logs backend | grep -i "updateSupabaseAppMetadata\|app_meta"`.
**Causas conhecidas:** `SUPABASE_SERVICE_ROLE_KEY` incorreta no `.env` do VPS; `SUPABASE_URL` com trailing slash (já tratado com `strings.TrimRight`); timeout de rede para o Supabase Admin API.
**Fix permanente:** Corrigir `SUPABASE_SERVICE_ROLE_KEY` no VPS se incorreta. O código agora retenta 3 vezes com 500ms de backoff e loga o status HTTP e body de erro exato.

---

## Tabela Resumo de Riscos

| Código | Risco | Severidade | Probabilidade |
|---|---|---|---|
| R1 | Remoção volume evolution_instances | Crítico | Baixa (acidente) |
| R2 | ASAAS_WEBHOOK_TOKEN divergente | Crítico | Média (rotação de token) |
| R3 | Porta errada EVOLUTION_DATABASE_URL | Crítico | Baixa |
| R4 | RLS desativado | Crítico | Baixa |
| R5 | Commit de .env | Crítico | Baixa |
| R6 | Runner parado | Alto | Média |
| R7 | SSL expirado | Alto | Baixa |
| R8 | Variável obrigatória ausente | Alto | Média |
| R9 | Limite de plano quebrado | Alto | Baixa |
| R10 | Grace period não aplicado | Alto | Baixa |
| R11 | Pool DB esgotado | Médio | Baixa |
| R12 | OpenRouter sem chave | Médio | Média |
| R13 | Memory limit Evolution (768m) | Médio | Baixa (mitigado com NODE_OPTIONS + Redis) |
| R14 | Cache Nginx desatualizado | Baixo | Alta (esperado) |
| R15 | updateSupabaseAppMetadata falha silenciosa | Médio | Média (dependente de config VPS) |
