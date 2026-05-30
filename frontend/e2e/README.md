# Testes E2E — RevendaClick (Playwright)

## Pré-requisitos

```bash
cd frontend
npm install
npx playwright install chromium
```

## Variáveis de Ambiente

Criar `frontend/.env.e2e` (nunca commitar):

```env
E2E_BASE_URL=http://localhost:3000
E2E_API_URL=http://localhost:8080

# Tenant Starter (santos-car ou sandbox)
E2E_STARTER_EMAIL=...
E2E_STARTER_PASSWORD=...

# Super Admin
E2E_SUPER_ADMIN_EMAIL=dilneysantos.developer@gmail.com
E2E_SUPER_ADMIN_PASSWORD=...

# ID do tenant usado para simulate-event
E2E_TEST_TENANT_ID=...
```

## Como Executar

```bash
# Subir o app localmente antes
cd frontend && npm run dev

# Executar todos os testes (headless)
npm run test:e2e

# Executar com UI interativa
npm run test:e2e:ui

# Ver relatório do último run
npm run test:e2e:report

# Executar fluxo específico
npx playwright test e2e/01_onboarding.spec.ts
npx playwright test e2e/02_billing_subscribe.spec.ts
```

## Cobertura dos Fluxos

| Arquivo | Fluxo | Pré-req crítico |
|---|---|---|
| `01_onboarding.spec.ts` | Cadastro → Tenant → Onboarding → Dashboard | Supabase Auth sem confirmação de e-mail |
| `02_billing_subscribe.spec.ts` | Sidebar Starter + sub-nav Billing + 3 planos | E2E_STARTER_EMAIL |
| `03_upgrade_downgrade.spec.ts` | Upgrade/Downgrade via simulate-event | E2E_TEST_TENANT_ID + super_admin |
| `04_whatsapp_addon.spec.ts` | WhatsApp add-on + aba Configurações | E2E_STARTER_EMAIL |
| `05_ia_recovery.spec.ts` | IA Recovery add-on | E2E_STARTER_EMAIL |

## Onde Executar

**Local:** `http://localhost:3000` com backend em `http://localhost:8080`

**Staging/Homologação:** Configurar `E2E_BASE_URL=https://...` + Asaas sandbox

**CI/CD:** Adicionar step no GitHub Actions após deploy de staging (não em produção)

## Importante

- Testes E2E não rodam em produção (dados reais, cobranças reais)
- Para billing: usar sempre `ASAAS_ENV=sandbox` ou `simulate-event`
- `test.skip` nos testes que requerem credenciais não configuradas — é intencional
- Fluxo 1 (onboarding) requer banco limpo ou slug único por execução (usa timestamp)
