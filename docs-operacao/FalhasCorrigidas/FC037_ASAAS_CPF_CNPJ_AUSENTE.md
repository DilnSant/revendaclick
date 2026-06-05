# FC037 — Asaas HTTP 400: CPF/CNPJ ausente ao contratar plano

**Data:** 05/06/2026
**Sessão:** 41 cont.
**Severity:** CRÍTICO — impedia 100% das novas assinaturas

---

## Causa Raiz

- **Origem:** `POST /api/billing/subscribe` → `service.go:Subscribe()`
- **Arquivo responsável:** `backend/internal/billing/service.go`
- **Função responsável:** `Subscribe()`
- **Problema:** `service.go:Subscribe()` lia `req.CPFOrCNPJ` do body HTTP. O frontend nunca enviava esse campo. A coluna `cpf_cnpj` não existia na tabela `tenants`. Asaas exige CPF ou CNPJ para criar cobrança — retornava HTTP 400 `invalid_object: Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente`.

---

## Correção

### Migration aplicada

`database/migrations/035_add_cpf_cnpj_to_tenants.sql`:
```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(18);
```

### Backend

- `backend/internal/tenant/model.go` — `CPFOrCNPJ *string` em `Tenant` + `UpdateRequest`
- `backend/internal/tenant/repository.go` — `cpf_cnpj` em SELECT/UPDATE/RETURNING/scanTenant
- `backend/internal/billing/repository.go` — `GetAsaasCustomerID` retorna 5 valores (+ cpfCnpj)
- `backend/internal/billing/asaas.go` — `updateCustomer()` adicionado (PUT /customers/{id})
- `backend/internal/billing/service.go`:
  - `Subscribe()` lê `cpfCnpj` do banco em vez do body HTTP
  - Valida `cpfCnpj != ""` antes de chamar Asaas — retorna erro amigável
  - Se customer Asaas já existe: `updateCustomer()` sincroniza CPF/CNPJ antes de criar subscription
  - 3 call sites de `GetAsaasCustomerID` atualizados para 5 valores de retorno

### Frontend

- `frontend/lib/tenant.ts` — `cpf_cnpj: string | null` no tipo `Tenant`
- `frontend/app/(dashboard)/settings/actions.ts` — `cpf_cnpj` em `TenantUpdatePayload`
- `frontend/app/(dashboard)/settings/page.tsx` — `cpf_cnpj` passado ao `SettingsTabs`
- `frontend/app/(dashboard)/settings/_components/SettingsTabs.tsx`:
  - Campo CPF/CNPJ com máscara automática (CPF: `XXX.XXX.XXX-XX` / CNPJ: `XX.XXX.XXX/XXXX-XX`)
  - Validação com dígitos verificadores (algoritmo completo CPF e CNPJ)
  - `PlanTab`: gate amigável (banner âmbar) quando `cpf_cnpj` ausente; botões desabilitados
- `frontend/app/(dashboard)/billing/plans/page.tsx` — `getTenantById` para obter cpf_cnpj
- `frontend/app/(dashboard)/billing/plans/_components/PlansGrid.tsx` — repassa cpfCnpj ao PlanCard
- `frontend/app/(dashboard)/billing/plans/_components/PlanCard.tsx`:
  - Gate amigável + botão "Preencher agora" → `/settings?tab=store`
  - Campo CPF ad hoc removido (não é solução — era workaround incorreto)

### Fluxo implementado

```
Lojista → Settings → Loja → CPF/CNPJ (máscara + validação) → Salvar
                                                                    ↓
Contratar plano → cpf_cnpj ausente → gate âmbar + "Preencher agora"
                → cpf_cnpj presente → Subscribe() → lê do DB → valida → Asaas OK
```

---

## Prevenção

- CPF/CNPJ deve sempre vir do banco (tenant) — nunca do body HTTP — para evitar inconsistência entre UI e Asaas.
- `Subscribe()` valida `cpfCnpj != ""` e retorna erro antes de chamar Asaas — falha rápida com mensagem legível.
- Campo CPF/CNPJ no Settings com validação de dígitos verificadores impede dados inválidos no banco.
- Nunca adicionar campos de billing diretamente no body HTTP do frontend — dados sensíveis devem vir da fonte de verdade (banco).

---

## Commits

| Hash | Descrição |
|---|---|
| `e075945` | feat(billing): CPF/CNPJ obrigatório para assinatura Asaas (13 arquivos) |
| `6e34570` | docs: registro FC037 em 22_HISTORICO + 23_PROXIMO + REFERENCE |
