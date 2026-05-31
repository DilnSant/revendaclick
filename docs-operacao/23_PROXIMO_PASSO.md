# 23 — PRÓXIMO PASSO

> Atualizado em: 31/05/2026 (sessão 26 — saneamento final)
> Atualizar este arquivo ao final de cada sessão com o que deve ser feito na próxima.

---

## Guia de Leitura por Tipo de Tarefa

> Leia isso PRIMEIRO, antes de abrir qualquer outro arquivo.

| Tipo de tarefa | Arquivos para ler |
|---|---|
| Qualquer tarefa | `23_PROXIMO_PASSO.md` (este) + `20_PENDENCIAS.md` |
| Alterar banco / migrations | `05_SUPABASE.md` → aplicar → regenerar `database.types.ts` |
| Alterar backend Go | `04_BACKEND.md` + `08_API_ROTAS_REAIS.md` |
| Alterar infra / docker | `10_INFRA_VPS.md` + `11_DOCKER.md` |
| Fazer deploy | `13_DEPLOY.md` + `12_CICD.md` |
| Diagnosticar bug | `FalhasCorrigidas/README.md` → buscar padrão similar |
| Precisar de valor fixo (IP, ID, URL) | `REFERENCE.md` |
| Entender decisão arquitetural | `21_DECISOES_TECNICAS.md` |
| Ver estado atual de qualquer feature | `22_HISTORICO_ALTERACOES.md` (topo — ESTADO ATUAL) |

---

## Estado Atual do Projeto (sessão 26 — 31/05/2026)

| Componente | Status |
|---|---|
| Backend Go | ✓ CI/CD automático — VPS atualizado |
| Frontend Next.js | ✓ Vercel — auto-deploy ativado via push para main |
| Migration 022 | ✓ aplicada — performance→premium, features por plano, add-ons features |
| Migration 023 | ✓ aplicada — fix get_tenant_usage: branch tenant_features restaurado |
| Migration 024 | ✓ aplicada — RLS plan_addons + rename premium→performance |
| Migration 025 | ✓ aplicada — users.tenant_id nullable (super_admin sem tenant) |
| database.types.ts | ✓ regenerado pós-024 — 131.307 chars |
| Planos públicos | ✓ Starter/Pro/Premium (3 cards); Scale oculto (CTA Enterprise) |
| Add-ons | ✓ user_extra(R$20) / whatsapp_automation(R$39) / ia_recovery(R$39) — endpoints ativos |
| Sidebar | ✓ **REFATORADA** — Starter/Pro/Premium por feature flag; sub-navs Financeiro+Billing |
| Feature flags 3-way | ✓ plan.features UNION tenant_features UNION addon.features |
| plan_gate.go | ✓ 3 UNION ALL — plano + tenant_features + add-on features |
| Admin panel | ✓ /admin — super_admin protegido, ações por tenant |
| AdminSimulateEvent | ✓ POST /api/admin/billing/simulate-event — super_admin injeta eventos fake sem Asaas |
| DevActivate | ✓ POST /api/billing/dev/activate — ativo apenas fora de produção |
| OnboardingChecklist | ✓ widget no dashboard (4 obrigatórios + 1 WhatsApp opcional) |
| super_admin | ✓ dilneysantos.developer@gmail.com — tenant_id=NULL, role=super_admin |
| Central de Atendimento santos-car | ✓ instância Evolution `open` (554888482877); feature central_atendimento concedida |
| /automations | ✓ placeholder gated has_api_access; CTA WhatsApp add-on condicional |
| /campaigns | ✓ placeholder gated has_api_access |
| Testes unitários billing | ✓ +4 funções: webhookAsaasID, asaasUserErr, capitalize, event key |
| Prompts operacionais | ✓ /prompts/ (raiz) — 5 arquivos; procedimento oficial de sessão |
| Migration 026 | ✓ performance → premium (definitivo); DB + código + docs sincronizados |
| FC030 | ✓ SettingsTabs name:'premium' vs DB 'performance' — corrigido via migration 026 |
| D29 | ✓ plan.name = 'premium' definitivo — decisão técnica registrada |
| CI/CD GitHub Actions | ✓ automático |
| Evolution API v2.3.7 | ✓ healthy |
| Billing Asaas | ✓ subscribe + upgrade end-to-end |
| Supabase security advisors | ✓ limpos |
| FalhasCorrigidas | ✓ 30 FCs documentadas (FC001–FC030) |
| PRODUCT_ARCHITECTURE.md | ✓ criado — fonte única da arquitetura de negócio |
| DEPENDENCIES.md | ✓ criado — mapa de dependências por módulo |
| ENVIRONMENTS.md | ✓ criado — produção / homologação / desenvolvimento |
| Testes E2E (Playwright) | ✓ estrutura criada — 5 specs / 6 fluxos; Playwright instalado |
| Auditoria devecar | ✓ removido como tenant operacional; Coolify → Vercel corrigido em docs |
| Memory OBSOLETO | ✓ seção OBSOLETO criada em MEMORY.md (8 itens) |
| Governança sessão | ✓ protocolo de fim de sessão em 23_PROXIMO_PASSO.md |
| **Saneamento documental (sessão 26)** | ✓ 4 divergências corrigidas; docs-operacao/prompts/ removido; referências prompts/ (raiz) corrigidas |
| **sandbox-revendaclick** | ✓ criado — Pro active, tenant_id: `e72eb104-98b7-4a71-946d-15e680496fc3` |
| **E2E .env.e2e** | ✓ template criado em `frontend/.env.e2e` |
| **METRICS_TOKEN** | ✓ confirmado presente e funcional no VPS (nginx bloqueia externo — correto) |
| **santos-car plano** | ✓ Atualizado: santos-car está em Pro (corrigido em REFERENCE.md + ENVIRONMENTS.md) |

---

## REGRA OBRIGATÓRIA — Após cada migration Supabase

Sempre regenerar `frontend/lib/database.types.ts` antes de qualquer commit que referencie novas tabelas:

```bash
# Via MCP ou CLI Supabase:
supabase gen types typescript --project-id ibgaywezfcbbiiziaoac > frontend/lib/database.types.ts
```

**Origem:** FC029 — 8 deploys consecutivos falharam por este motivo.

---

## Nova Estrutura da Sidebar (sessão 23 fim — DEFINITIVA)

```
Dashboard
Veículos
Interessados
Clientes              ← todos os planos (antes era Pro+)

─── Pro ───────────── gated has_crm
Atendimento (CRM)
Analytics

─── Premium ────────── gated has_api_access
Automações
Campanhas

Assinatura            ← sub-nav: Assinatura / Add-ons / Cobranças / Planos
Configurações         ← sub-nav tabs: Loja / Contato Público / Usuários / Plano / WhatsApp
```

**Financeiro** tem sub-nav interno: Resumo / Vendas / Comissões

---

## Próximos Passos (por prioridade)

### 1. Verificar sidebar no browser em produção (ALTA)

santos-car está em plano Pro. Testar:

| Perfil | Esperado |
|---|---|
| **santos-car (Pro)** | Dashboard/Veículos/Interessados/Clientes/Financeiro + seção Pro (Atendimento/Analytics) + Assinatura/Configurações |
| **sandbox-revendaclick (Pro)** | Mesmo comportamento — tenant isolado para testes agressivos |

Verificar:
- Financeiro → sub-nav mostrando Resumo/Vendas/Comissões
- Assinatura → sub-nav mostrando Assinatura/Add-ons/Cobranças/Planos
- Configurações → aba WhatsApp visível (5ª aba)

### 2. Preencher senhas no .env.e2e e executar E2E (Média)

Template criado em `frontend/.env.e2e`. Preencher `PREENCHER` com senhas reais:
- `E2E_STARTER_PASSWORD` — senha do dilneysantos@gmail.com
- `E2E_SUPER_ADMIN_PASSWORD` — senha do dilneysantos.developer@gmail.com
- Criar usuário para sandbox-revendaclick e preencher `E2E_SANDBOX_PASSWORD`

Ver `frontend/e2e/README.md`.

### 3. Itens que exigem ação manual (Baixa)

**3a. Leaked Password Protection:**
```
Supabase Dashboard → Authentication → Settings → Security → "Leaked Password Protection" → ON
```

**3b. Uptime Monitoring:**
```
UptimeRobot ou BetterStack Uptime
URL: https://api.revendaclick.com.br/health
Alerta por email
```

**3c. Backup S3 (opcional — rc_backup container já existe):**
```bash
# No VPS /opt/revendaclick/.env:
BACKUP_S3_BUCKET=meu-bucket-s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=sa-east-1
```

**3d. Rotação de Secrets (política semestral):**
```
ASAAS_API_KEY, EVOLUTION_API_KEY, METRICS_TOKEN
Atualizar: /opt/revendaclick/.env no VPS + Asaas Dashboard + reiniciar containers
```

### 4. Etapas comerciais (próximas sessões)

- **Etapa 5** — Billing gateway abstraction (desvincular do Asaas → interface BillingGateway)
- **Etapa 10** — Auditoria final (RLS, tenant isolation, TypeScript strict, Go vet)

### 5. Evolution schema isolado (Baixa — D19)

Configurar `DATABASE_SCHEMA=evolution` no docker-compose da Evolution. Ver D19 em `21_DECISOES_TECNICAS.md`.

---

## Documentação de Falhas

Pasta `docs-operacao/FalhasCorrigidas/` — **30 falhas documentadas (FC001–FC030)**.
Próximo número disponível: **FC031**.

Antes de diagnosticar qualquer problema: consultar primeiro o [README de FalhasCorrigidas](FalhasCorrigidas/README.md).

---

## GOVERNANÇA — Protocolo Obrigatório de Sessão

### Prompts operacionais oficiais

Localização: **pasta `/prompts/` na raiz do repositório**

| Arquivo | Quando usar |
|---|---|
| `prompts/00_PROMPT_INICIO_SESSAO.md` | **Obrigatório** no início de toda sessão |
| `prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md` | **Obrigatório** ao encerrar toda sessão |
| `prompts/02_PROMPT_AUDITORIA.md` | Ao revisar módulo ou suspeitar de divergência |
| `prompts/03_PROMPT_BUG_CRITICO.md` | Imediatamente ao identificar bug/incidente |
| `prompts/04_PROMPT_DEPLOY.md` | Antes e após qualquer deploy em produção |

### Protocolo de Fim de Sessão

Toda sessão encerrada **deve** executar os seguintes passos antes do último commit:

### 1. Atualizar 22_HISTORICO_ALTERACOES.md
- Adicionar entrada com data, sessão e resumo das alterações
- Atualizar a tabela **ESTADO ATUAL POR FEATURE** no topo

### 2. Atualizar 23_PROXIMO_PASSO.md (este arquivo)
- Atualizar data no topo
- Atualizar tabela "Estado Atual do Projeto"
- Atualizar seção "Próximos Passos" com prioridades corretas

### 3. Atualizar Snapshot de Features
A tabela ESTADO ATUAL em `22_HISTORICO_ALTERACOES.md` deve refletir o estado real.
Nunca deixar features como "⚠ 404" se já foram implementadas.

### 4. Atualizar Memory (project_status.md)
Atualizar `/home/dilneysantos/.claude/projects/.../memory/project_status.md` com:
- Migrações aplicadas
- Features concluídas
- Pendências atuais

### 5. Mover itens obsoletos
Se algo deixou de ser válido (plano renomeado, serviço trocado, rota removida):
- Mover para a seção **OBSOLETO** em `MEMORY.md`
- Incluir: data, motivo, substituto

### 6. Verificar consistência
- `REFERENCE.md` reflete valores reais (migrations, FCs, URLs)?
- `CLAUDE.md` CURRENT STATUS ainda aponta para docs corretos?
- Algum arquivo diz "Coolify" quando deveria dizer "Vercel"?

---

## Contexto para a Próxima Sessão

**Copiar e executar ao iniciar:**

```
prompts/00_PROMPT_INICIO_SESSAO.md
```

**Copiar e executar ao encerrar:**

```
prompts/01_PROMPT_ENCERRAMENTO_SESSAO.md
```

Ao iniciar uma nova sessão:

1. Executar `prompts/00_PROMPT_INICIO_SESSAO.md` (leitura + diagnóstico completo)
2. Ler `20_PENDENCIAS.md` — o que está pendente
3. Ler este arquivo (`23_PROXIMO_PASSO.md`) — o que fazer agora
4. Se for alterar banco: ver `05_SUPABASE.md` primeiro **e regenerar `database.types.ts` após migration**
5. Se for alterar infra: ver `10_INFRA_VPS.md` e `11_DOCKER.md`
6. Se for alterar backend: ver `04_BACKEND.md` e `08_API_ROTAS_REAIS.md`
7. Se for fazer deploy: executar `prompts/04_PROMPT_DEPLOY.md`

**ATENÇÃO .env VPS:** Variáveis com `$` literal devem usar `$$`. Ver D18 em `21_DECISOES_TECNICAS.md`.

**ATENÇÃO Tailwind primary:** Agora usa `rgb(var(--primary) / α)`. Store layout injeta canais RGB do tenant. Ver D20 em `21_DECISOES_TECNICAS.md`.

**ATENÇÃO database.types.ts:** Regenerar após cada migration. Ver FC029.

**ATENÇÃO sidebar:** Nova estrutura definitiva — ver D28 em `21_DECISOES_TECNICAS.md`. Nunca usar `plan_name` hardcoded.
