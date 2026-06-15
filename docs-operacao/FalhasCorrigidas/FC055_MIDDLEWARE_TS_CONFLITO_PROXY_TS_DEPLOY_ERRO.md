# FC055 — middleware.ts conflito com proxy.ts em Next.js 16.2.6 — 4 deploys com ERROR

**Sessão:** 57  
**Data:** 2026-06-15  
**Commit:** `ff00b46`  
**Severidade:** CRÍTICA (4 deploys consecutivos falharam; nenhuma correção das sessões 55–56 chegou à produção)

---

## Commits afetados (todos com state=ERROR na Vercel)

| Commit | Sessão | Conteúdo |
|---|---|---|
| `cfc060f` | 55 | fix(fc053): super admin delete tenant — Acesso negado |
| `c0d0b25` | 55 | docs(fc053) |
| `4e22465` | 56 | fix(fc054): 3 bugs de produção |
| `c78016c` | 56 | docs(fc054) |

---

## Causa Raiz

**Erro exato no build Vercel:**
```
Error: Both middleware file "./middleware.ts" and proxy file "./proxy.ts" are detected.
Please use "./proxy.ts" only.
Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```

**Next.js 16.2.6 usa `proxy.ts` como arquivo de middleware nativo**, não `middleware.ts`. O arquivo `proxy.ts` já existia e já era o middleware ativo. O CLAUDE.md do projeto documenta isso explicitamente: `"proxy.ts instead of middleware.ts"`.

Na sessão 55 (FC053), foi criado `frontend/middleware.ts` com a intenção de "wiring" do `proxy.ts` como middleware — o que era desnecessário pois `proxy.ts` já cumpria essa função. A criação de `middleware.ts` gerou um conflito que o Next.js 16 não tolera: dois arquivos de middleware detectados simultaneamente.

---

## Diagnóstico

- Primeiro deploy com ERROR: `dpl_9PyGSm21GSiPEojpkyzE5PiiAV3W` (commit `cfc060f`)
- Último deploy READY anterior: `dpl_AbxSu77H715uF8D47aXiySKfEDfj` (commit `8ce05ef`, docs FC052)
- Build falha logo após `▲ Next.js 16.2.6 (Turbopack)`, antes de compilar qualquer página
- Tempo total de indisponibilidade do pipeline: 4 commits / ~1 hora

---

## Arquivo Afetado

| Ação | Arquivo |
|---|---|
| REMOVIDO (fix) | `frontend/middleware.ts` |

O arquivo continha apenas:
```typescript
import { proxy, config } from './proxy'
export default proxy
export { config }
```
Desnecessário — `proxy.ts` já é detectado como middleware pelo Next.js 16 diretamente.

---

## Correção Aplicada

```bash
rm frontend/middleware.ts
```

Commit `ff00b46` — 1 arquivo deletado.

---

## Implicação para FC053

A correção real do FC053 (super admin DELETE "Acesso negado") consistia em 2 fixes, não 3:

1. ✅ **`route.ts`: `getSession()` → `getUser()`** — ainda válido e aplicado
2. ✅ **`route.ts`: DELETE body forwarding** — ainda válido e aplicado  
3. ~~`middleware.ts` criado para wiring de `proxy.ts`~~ — **ERRADO**: proxy.ts já era o middleware ativo em Next.js 16.2.6

---

## Regra derivada

**Em Next.js 16.2.6 (e posteriores), o arquivo de middleware é `proxy.ts`, não `middleware.ts`.** Nunca criar `middleware.ts` neste projeto — causará conflito fatal com `proxy.ts` no build Vercel.

O CLAUDE.md já documentava: `"proxy.ts instead of middleware.ts"` — esta instrução deve ser respeitada literalmente.

---

## Validação

- `npx tsc --noEmit` → zero erros após remoção
- Commit `ff00b46` pushed → Vercel deploy `dpl_9XuhFKQrkP7WahDqkdV1gs755wXZ` iniciado com state=BUILDING

---

## FC056 — Adendo: divergências relatadas após FC054/FC055

Ver FC056 para o diagnóstico completo. Resumo dos dois achados:

1. `/admin/logs` 404: confirmado pelo log de runtime Vercel (404 às 22:02:30 pré-ff00b46; 200 a partir de 22:03 pós-ff00b46). Estava corrigido pelo deploy FC055, mas os testes do usuário eram de antes do deploy.

2. "Reativar" não visível: o botão foi implementado em `SubscriptionsTable.tsx` (`/admin/subscriptions`), mas o fluxo natural do admin é via `/admin/tenants`. Corrigido em FC056 — `AdminTenantsTable.tsx` agora exibe "Reativar" quando `sub_status === 'canceled'` e "Ativar Pro" nos demais casos.
