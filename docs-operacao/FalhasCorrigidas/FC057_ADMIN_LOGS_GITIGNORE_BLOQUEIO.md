# FC057 — /admin/logs 404 definitivo — página nunca commitada por `logs/` no .gitignore

**Sessão:** 57  
**Data:** 2026-06-15  
**Commit:** `0e3538c`  
**Severidade:** CRÍTICA (rota inacessível em produção desde a criação — nunca chegou ao repositório)

---

## Causa Raiz

**`.gitignore` linha 40 continha `logs/` (não ancorada).**

Em gitignore, uma regra sem `/` inicial ou final é recursiva — ignora qualquer diretório chamado `logs/` em qualquer subpath do repositório. Isso causou o bloqueio silencioso de:

```
frontend/app/(admin)/admin/logs/page.tsx
```

O arquivo existia **apenas localmente**. Nunca foi rastreado pelo git, nunca foi commitado, nunca chegou à Vercel. Toda vez que a Vercel fazia o build a partir do GitHub, a rota `/admin/logs` simplesmente não existia no filesystem — resultado: 404.

---

## Diagnóstico Técnico

```bash
# Confirma que o arquivo estava sendo ignorado:
git check-ignore -v "frontend/app/(admin)/admin/logs/page.tsx"
# → .gitignore:40:logs/    frontend/app/(admin)/admin/logs/page.tsx

# Arquivo existe localmente mas não está no índice git:
git ls-files | grep "admin/logs"
# → (nenhum resultado)

# Aparece apenas como untracked ignorado:
git ls-files --others | grep "admin/logs"
# → frontend/app/(admin)/admin/logs/page.tsx
```

---

## Histórico da Confusão

| Sessão | FC | O que foi feito | Por que não resolveu |
|---|---|---|---|
| 54 | FC054 | `layout.tsx`: `getSession()` → `getUser()` | Fix correto, mas a página ainda não existia no git |
| 55 | FC055 | Remoção de `middleware.ts` conflitante | Fix correto, restaurou pipeline — mas sem a página |
| 56 | FC056 | `AdminTenantsTable`: botão "Reativar" condicional | Fix de outro problema — logs continuou sem a página |
| 57 | **FC057** | **Arquivo commitado + `.gitignore` corrigido** | **CAUSA RAIZ eliminada** |

A sessão 56 (FC056 Divergência 1) havia interpretado que os 200s nos logs Vercel confirmavam que a rota existia pós-deploy. Os 200s eram de deploy antigo ou comportamento do runtime que não correspondia ao estado real do repositório.

---

## Arquivos Alterados

| Ação | Arquivo | Detalhe |
|---|---|---|
| CORRIGIDO | `.gitignore` | `logs/` → `/logs/` (root-anchored) |
| ADICIONADO ao git | `frontend/app/(admin)/admin/logs/page.tsx` | Primeira vez rastreado e commitado |
| ALTERADO | `frontend/app/login/page.tsx` | `router.push()` → `window.location.href` + `redirect` param respeitado para super_admin |

---

## Correção 1 — `.gitignore`

```diff
-logs/
+/logs/
```

A forma `/logs/` só ignora um diretório `logs/` na raiz do repositório — sem impacto em rotas da aplicação.

---

## Correção 2 — `admin/logs/page.tsx` commitado

Adicionado `export const dynamic = 'force-dynamic'` como medida extra (garante que a página nunca seja cacheada pelo Next.js, independente de estado de session).

```bash
git add "frontend/app/(admin)/admin/logs/page.tsx"
```

---

## Correção 3 — `login/page.tsx` (fix secundário)

Durante a investigação, foi identificado que após expiração de sessão:
1. `proxy.ts` redirecionava para `/login?redirect=/admin/logs`
2. Após re-login, super_admin era mandado para `/admin` (ignorando o `redirect` param)
3. O usuário navegava por sidebar (RSC client-side), podendo encontrar race condition com middleware

**Fix:**
- `window.location.href = destination` em vez de `router.push()` — full page load garante que cookies frescos cheguem ao `proxy.ts` antes do render
- `redirect` param agora é respeitado para super_admin (com validação: deve começar com `/` e não ser `/login`)

```diff
-const destination = role === 'super_admin' ? '/admin' : redirect
-router.push(destination)
-router.refresh()
+const safeRedirect = redirect && redirect !== '/login' && redirect.startsWith('/') ? redirect : null
+const destination = safeRedirect ?? (role === 'super_admin' ? '/admin' : '/dashboard')
+window.location.href = destination
```

---

## Validação

```bash
# TypeScript zero erros:
npx tsc --noEmit
# → (nenhuma saída)

# Build local — /admin/logs registrado como rota dinâmica:
npm run build
# → ├ ƒ /admin/logs

# Git status confirma 3 arquivos:
git status --short
# → M  .gitignore
# → A  frontend/app/(admin)/admin/logs/page.tsx
# → M  frontend/app/login/page.tsx
```

**Deploy:** commit `0e3538c` → Vercel `dpl_53YWmJSxofTVHqnWjjf4xbJS8hbW` → **state: READY** em `app.revendaclick.com.br`

---

## Regra derivada

**Regras de gitignore sem `/` inicial são recursivas e podem bloquear diretórios de rotas Next.js.**

Padrões de log/temp devem sempre ser anchorados à raiz (`/logs/`, `/tmp/`) ou usar extensões (`*.log`) em vez de nomes de diretório genéricos.
