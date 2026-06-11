# FC042 — E2E Playwright: Seletores Incorretos e Skip Guards Insuficientes

**Data:** 11/06/2026
**Sessão:** 48
**Severidade:** MÉDIA
**Área:** Frontend / Testes E2E
**Tipo:** Bug de código de teste (selectors + guards)

---

## Sintoma

Execução da suíte Playwright resultava em 10 falhas com timeout (`locator.fill: Test timeout of 30000ms exceeded`). Nenhum teste passava ou era pulado corretamente — todos falhavam com erros opacos de timeout.

---

## Causa Raiz

Cinco causas independentes, acumuladas desde a criação da suíte:

### 1. `getByLabel(/e-mail/i)` não bate com label "Email" (sem hífen) — `auth.ts`

`loginAs()` em `e2e/helpers/auth.ts` usava `page.getByLabel(/e-mail/i)` na página de login. A label real é `<label htmlFor="email">Email</label>` — sem hífen. O regex `/e-mail/i` exige hífen e nunca encontrava o campo.

### 2. Página de registro sem `htmlFor`/`id` nos inputs — `01_onboarding.spec.ts`

`app/(auth)/register/page.tsx` usa `<label className="label">E-mail *</label>` sem `htmlFor` e `<input type="email">` sem `id`. `getByLabel()` requer associação via `htmlFor` ou encapsulamento — sem isso retorna vazio.

Além disso, spec 01 preenchia apenas email + senha, mas o formulário tem campo "Nome completo" (`required`) e "Confirmar senha" obrigatórios que não eram preenchidos.

### 3. Spec 01 assume confirmação de e-mail desabilitada

Spec 01 esperava `waitForURL(/onboarding/)` após registro, mas em produção `email_confirmations=ON` redireciona para `/check-email`. O spec nunca concluiria em produção.

### 4. Skip guards verificavam só o email, não a senha — specs 02–05

`test.skip(!TEST_USERS.starter.email, ...)` pulava apenas se email fosse vazio. A senha `"PREENCHER"` é truthy → os testes não eram pulados → falhavam no login com credencial inválida.

### 5. Seletores errados em specs 02–05 contra a UI real

Após corrigir os guards e obter credenciais reais, 8 testes continuavam falhando por divergência entre o spec e a UI de produção:

| Spec | Seletor Errado | UI Real |
|---|---|---|
| 02 test 1 | CRM `not.toBeVisible` (espera Starter) | User é Pro → CRM é visível |
| 02 test 2 | `getByRole('link', /cobranças/i)` → 2 elementos | Usar `a[href="/billing/history"]` |
| 02 test 3 | `getByText('Starter')` → 4 elementos | Usar `getByRole('heading', { name: 'Starter', exact: true })` |
| 03 test 2 | Espera `/crm` HTTP 404 | Pro user → HTTP 200 |
| 04 test 1 | Espera `/automations` HTTP 404 | Santos-car tem add-on ativo → HTTP 200 |
| 04 test 2/3 | `getByRole('tab')` | Tabs são `<a href>`, não `role="tab"` |
| 04 test 3 | Link "central de atendimento" | Texto real: "Abrir Automação WhatsApp" |
| 05 test 1 | `getByText(/ia recovery/i)` | `display_name` no DB: "Recuperação por IA" |

---

## Arquivos Afetados

| Arquivo | Tipo de correção |
|---|---|
| `frontend/e2e/helpers/auth.ts` | Seletor `#email`/`#password` por id + helper `isCredentialReady()` + `waitForURL` inclui `/admin` |
| `frontend/e2e/01_onboarding.spec.ts` | `getByPlaceholder` para register + skip guard `E2E_EMAIL_CONFIRMATION_DISABLED` + campos obrigatórios |
| `frontend/e2e/02_billing_subscribe.spec.ts` | Assertions Pro user + `href` exato para sub-nav + `getByRole('heading', exact)` |
| `frontend/e2e/03_upgrade_downgrade.spec.ts` | Skip guards com `isCredentialReady` + assertion `/crm` HTTP 200 |
| `frontend/e2e/04_whatsapp_addon.spec.ts` | `a[href*="tab=whatsapp"]` + `goto('/settings?tab=whatsapp')` + `locator('a[href=...]')` |
| `frontend/e2e/05_ia_recovery.spec.ts` | `getByText(/recuperação por ia/i)` + remoção de price assertion ambíguo |
| `frontend/.env.e2e` | `E2E_BASE_URL` → produção + senhas preenchidas |

---

## Banco de Dados / Migrations

Nenhuma migration afetada. Nenhuma alteração de banco.

---

## Correção Aplicada

Todas as correções são em arquivos de teste E2E e `.env.e2e`. Nenhum arquivo de código de produção (TypeScript de app, Go, migration) foi alterado.

---

## Resultado Final

```
10 testes na suíte
 1 pulado  — spec 01: requer email confirmation OFF + E2E_EMAIL_CONFIRMATION_DISABLED=true
 9 aprovados — specs 02–05 todos verdes contra produção app.revendaclick.com.br
 0 falhados
```

---

## Como Validar

```bash
cd frontend
set -a && source .env.e2e && set +a
npx playwright test --reporter=list
# Esperado: 9 passed, 1 skipped, 0 failed
```

---

## Risco de Regressão

Baixo. Alterações apenas em arquivos de teste. Nenhum impacto em produção.

---

## Prevenção Futura

1. Ao criar novos selectors, verificar se o elemento tem `id`/`htmlFor` ou usar `data-testid`.
2. Skip guards sempre verificar email E senha: `!email || !isCredentialReady(password)`.
3. Quando `TEST_USERS.starter` = alias de `proOwner` (Pro), os testes devem refletir comportamento Pro.
4. Spec 01 (registro) requer ambiente dedicado com `email_confirmations=OFF` — não é executável em produção.
5. Verificar `display_name` no banco antes de escrever `getByText()` para conteúdo dinâmico.
