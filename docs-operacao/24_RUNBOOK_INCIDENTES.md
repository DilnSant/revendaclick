# 24 — RUNBOOK DE INCIDENTES

> Criado em: 25/05/2026
> Usar quando algo parar de funcionar em produção.
> Para cada incidente: diagnóstico → causa → solução → verificação.

---

## Como usar

1. Identifique o sintoma na lista abaixo
2. Siga o passo a passo
3. Após resolver, verifique o endpoint de saúde
4. Registre o incidente em `22_HISTORICO_ALTERACOES.md`

Acesso ao VPS:
```bash
ssh usuario@vps.revendaclick.com.br
cd /opt/revendaclick
```

---

## I1 — Site fora do ar (502 Bad Gateway)

**Sintoma:** Nginx retorna 502 para todas as rotas da API.

**Diagnóstico:**
```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs backend --tail=50
```

**Causas comuns:**

| Causa | Solução |
|---|---|
| Container backend parado | `docker compose -f docker-compose.production.yml up -d backend` |
| Variável obrigatória ausente no `.env` | Ver R8 — verificar `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Porta 8080 em conflito | `ss -tlnp \| grep 8080` → identificar e matar processo |
| OOM (sem memória) | `free -h` → se sem memória, reiniciar servidor ou aumentar swap |

**Verificação:**
```bash
curl -sf https://api.revendaclick.com.br/health && echo "OK"
```

---

## I2 — Loop infinito em /onboarding (usuário não chega ao dashboard)

**Sintoma:** Usuário faz login, vai para /dashboard, é redirecionado para /onboarding repetidamente.

**Diagnóstico:**
```bash
# 1. Verificar se usuário tem tenant no banco
# No Supabase SQL Editor:
SELECT au.email, pu.tenant_id, pu.role, au.raw_app_meta_data ->> 'tenant_id' AS jwt_claim
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'email@do.usuario';

# 2. Verificar logs do frontend no Vercel
# Vercel Dashboard → projeto → Functions → logs
```

**Causas e soluções:**

**Causa A:** Usuário tem tenant no banco mas JWT sem claim (raw_app_meta_data vazio):
```sql
-- Patch direto no Supabase SQL Editor
UPDATE auth.users au
SET raw_app_meta_data = au.raw_app_meta_data
  || jsonb_build_object('tenant_id', pu.tenant_id::text, 'user_role', pu.role)
FROM public.users pu
WHERE au.id = pu.id
  AND au.email = 'email@do.usuario'
  AND pu.tenant_id IS NOT NULL;
```

**Causa B:** `updateSupabaseAppMetadata` no backend falha silenciosamente:
```bash
# Ver logs do backend durante onboarding
docker compose -f docker-compose.production.yml logs backend --tail=100 | grep -i "supabase\|metadata\|app_meta\|updateSupabase"

# Se retornar 401 → SUPABASE_SERVICE_ROLE_KEY errada no .env
# Se retornar 404 → SUPABASE_URL errada (verificar trailing slash)
grep "SUPABASE" /opt/revendaclick/.env
```

**Causa C:** `SUPABASE_SERVICE_ROLE_KEY` não configurada no Vercel:
- Vercel Dashboard → Settings → Environment Variables → adicionar `SUPABASE_SERVICE_ROLE_KEY`

**Verificação:** Login com o usuário → deve ir direto para /dashboard.

---

## I3 — WhatsApp desconectado (todos os tenants)

**Sintoma:** Nenhum tenant consegue escanear QR code ou enviar mensagens.

**Diagnóstico:**
```bash
docker compose -f docker-compose.production.yml ps evolution
docker compose -f docker-compose.production.yml logs evolution --tail=50
```

**Causas e soluções:**

| Causa | Solução |
|---|---|
| Container parado | `docker compose -f docker-compose.production.yml up -d evolution` |
| OOM (limite 768m atingido) | `docker stats` → se memory > 768m: aumentar em `docker-compose.production.yml` → `memory: 1024m` → `docker compose up -d evolution` |
| Porta errada em `EVOLUTION_DATABASE_URL` | Verificar `.env` — deve ser porta **5432** (não 6543) |
| Volume de instâncias removido | **RECUPERAÇÃO IMPOSSÍVEL** — todos os tenants precisam reconectar via QR code |

**NUNCA executar `docker compose down -v`** — destrói o volume `evolution_instances`.

**Verificação:**
```bash
curl -sf https://evolution.revendaclick.com.br/ | head -20
```

---

## I4 — Pagamentos não ativam assinatura (webhooks Asaas falhando)

**Sintoma:** Cliente paga mas não recebe acesso. Assinatura permanece `trialing` ou `past_due`.

**Diagnóstico:**
```bash
# Ver logs de webhook no backend
docker compose -f docker-compose.production.yml logs backend --tail=100 | grep -i "asaas\|webhook\|payment"

# Verificar token configurado no .env
grep "ASAAS_WEBHOOK_TOKEN" /opt/revendaclick/.env

# Comparar com o token configurado no painel Asaas
# Asaas Dashboard → Integrações → Webhooks → ver token configurado
```

**Causas e soluções:**

| Causa | Solução |
|---|---|
| Token divergente entre .env e Asaas | Copiar token do `.env`, atualizar no painel Asaas (ou gerar novo e atualizar em ambos) |
| Backend retornando 401 para webhook | Token incorreto — ver acima |
| Webhook URL incorreta no Asaas | Deve ser `https://api.revendaclick.com.br/api/webhooks/asaas` |

**Verificação:**
```bash
# Verificar se rota de webhook responde (deve retornar 400/401, não 404/502)
curl -X POST https://api.revendaclick.com.br/api/webhooks/asaas -v 2>&1 | grep "< HTTP"
```

---

## I5 — Deploy automático parou (CI/CD travado)

**Sintoma:** Push para `main` não dispara deploy. GitHub Actions fica em "Queued" indefinidamente.

**Diagnóstico:**
```bash
# No VPS — verificar status do runner
sudo systemctl status actions.runner.*
```

**Solução:**
```bash
sudo systemctl restart actions.runner.*
# Aguardar 30s e verificar
sudo systemctl status actions.runner.*
```

**Se o runner não existir mais:**
```bash
# Reinstalar runner — ver instruções em Settings > Actions > Runners no GitHub
# Repo: github.com/dilneysantos/revendaclick → Settings → Actions → Runners → Add runner
```

**Verificação:** Fazer um push vazio e verificar se o workflow executa no GitHub Actions.

---

## I6 — SSL expirado (site com erro de certificado)

**Sintoma:** Browser mostra "Sua conexão não é segura". `curl` retorna SSL error.

**Diagnóstico:**
```bash
echo | openssl s_client -connect api.revendaclick.com.br:443 2>/dev/null | openssl x509 -noout -dates
```

**Solução:**
```bash
sudo certbot renew --nginx --force-renewal
sudo nginx -t && sudo systemctl reload nginx
```

**Verificação:**
```bash
curl -sf https://api.revendaclick.com.br/health && echo "SSL OK"
```

---

## I7 — Dashboard lento ou com timeout

**Sintoma:** Páginas do dashboard demoram >5s para carregar ou retornam 504.

**Diagnóstico:**
```bash
# Ver pool de conexões do banco
docker compose -f docker-compose.production.yml logs backend --tail=100 | grep -i "pool\|timeout\|deadline"

# Ver uso de recursos
docker stats --no-stream
```

**Causas e soluções:**

| Causa | Solução |
|---|---|
| Pool de conexões esgotado (`db_pool_wait_count` alto) | Aumentar `MaxConns` em `backend/internal/db/db.go` (verificar tier Supabase) |
| Query lenta no banco | `EXPLAIN ANALYZE` na query identificada nos logs |
| CPU do VPS saturada | `top` → identificar processo → escalar VPS se necessário |
| Supabase cloud lento | Verificar https://status.supabase.com |

---

## I8 — Erro 500 no frontend (página branca ou "Application Error")

**Sintoma:** Página do Next.js retorna erro 500 ou "An unexpected error occurred".

**Diagnóstico:**
```bash
# Ver logs do frontend no Vercel
# Vercel Dashboard → projeto → Deployments → último deploy → Functions → logs
# Ou via CLI (se tiver Vercel CLI instalado):
vercel logs --since=1h
```

**Causas comuns:**
- Variável de ambiente faltando no Vercel (ver `09_ENVS.md`)
- Bug em Server Component depois de deploy
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` expirada ou incorreta

**Rollback rápido se for deploy recente:**
```bash
# Via Vercel Dashboard → Deployments → deploy anterior → Promote to Production
```

---

## I9 — Usuário não consegue fazer login ("Email ou senha incorretos")

**Sintoma:** Credenciais corretas mas Supabase rejeita o login.

**Diagnóstico:**
```bash
# Verificar se usuário existe no Supabase
# Supabase Dashboard → Authentication → Users → buscar por email

# Verificar se NEXT_PUBLIC_SUPABASE_ANON_KEY está correta no Vercel
# Copiar de: Supabase Dashboard → Settings → API → anon key
```

**Causas e soluções:**

| Causa | Solução |
|---|---|
| Senha realmente errada | Supabase Dashboard → Users → usuário → Reset Password |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` errada no Vercel | Atualizar no Vercel com a chave correta do Supabase |
| Email não confirmado (se confirmation habilitado) | Supabase Dashboard → Users → usuário → Confirm email |
| Usuário banido/desabilitado | Supabase Dashboard → Users → usuário → habilitar |

---

## I10 — Feature de IA retorna erro 500 (`/api/ai/*`)

**Sintoma:** Classificação de lead ou sugestão de resposta falha com 500.

**Diagnóstico:**
```bash
docker compose -f docker-compose.production.yml logs backend --tail=50 | grep -i "openrouter\|openai\|ai\|classify"
grep "OPENROUTER" /opt/revendaclick/.env
```

**Solução:** Configurar ou rotacionar `OPENROUTER_API_KEY` no `.env` do VPS + reiniciar backend:
```bash
# Editar .env com a nova chave
nano /opt/revendaclick/.env

# Reiniciar backend
docker compose -f docker-compose.production.yml up -d backend
```

---

## Checklist pós-incidente

Após resolver qualquer incidente, verificar:

```bash
# 1. Saúde do backend
curl -sf https://api.revendaclick.com.br/health

# 2. Frontend carregando
curl -sf https://app.revendaclick.com.br/

# 3. Evolution respondendo
curl -sf https://evolution.revendaclick.com.br/

# 4. Todos os containers rodando
docker compose -f docker-compose.production.yml ps

# 5. Sem erros recentes nos logs
docker compose -f docker-compose.production.yml logs backend --tail=20
```

Registrar o incidente em `22_HISTORICO_ALTERACOES.md` com: data, sintoma, causa, solução, tempo de resolução.
