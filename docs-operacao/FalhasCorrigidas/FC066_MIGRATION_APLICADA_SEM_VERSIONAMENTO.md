# FC066 — Migration aplicada em produção sem nunca ter sido commitada

**Área:** Banco / Governança / CI-CD
**Severidade:** ALTA
**Data:** 06/08/2026
**Sessão:** 64

---

## Sintoma

`git status` acusava `database/migrations/040_reset_asaas_ids_conta_nova.sql` como **untracked**,
enquanto `REFERENCE.md` e `23_PROXIMO_PASSO.md` afirmavam que a migration 040 já estava **aplicada
em produção** — zerando `tenants.asaas_customer_id`, `subscriptions.asaas_subscription_id`,
`subscriptions.asaas_payment_link`, `subscription_addons.asaas_addon_id` e esvaziando
`billing_customers`.

Ou seja: o banco de produção estava num estado que o repositório não sabia descrever.

Descoberto na abertura da sessão 64 (continuação), ao conferir `git status` antes de qualquer
alteração — não por falha visível ao usuário.

---

## Causa Raiz

A migration foi escrita e aplicada via MCP do Supabase na mesma sessão em que a conta Asaas foi
trocada. O `git add` nunca aconteceu. Nada no fluxo obriga o commit:

1. A aplicação da migration não passa pelo git — vai direto ao Supabase via MCP.
2. O CI/CD só reage a **push**; um arquivo nunca adicionado é invisível para ele.
3. `.gitignore` não estava envolvido aqui (diferente do FC057), mas o efeito final foi o mesmo
   **arquivo real existindo só numa máquina**.

Agravante: o arquivo carrega ~29 linhas de comentário explicando *por que* o reset era necessário
(o guard de `billing/service.go:66-71` e o fallback que só cobre HTTP 404). Todo esse raciocínio
existia apenas no disco local.

---

## Arquivos Afetados

| Arquivo | Situação |
|---|---|
| `database/migrations/040_reset_asaas_ids_conta_nova.sql` | Aplicado em produção, untracked no git |

---

## Banco / Migrations

Migration 040 — já aplicada em produção antes desta correção. **Nenhuma alteração de banco foi feita
para corrigir este FC**: a correção é exclusivamente de versionamento.

---

## Correção Aplicada

Arquivo adicionado ao git sem nenhuma modificação de conteúdo, preservando os comentários de
justificativa e o bloco de verificação pós-aplicação.

---

## Commit(s)

```
4fa4f84 chore(billing): versionar migration 040 e ignorar anotações com credenciais
```

---

## Como Validar

```bash
# A migration deve estar rastreada
git ls-files database/migrations/ | grep 040

# Nenhuma migration pode estar untracked
git status --porcelain database/migrations/
# (saída vazia = correto)
```

---

## Resultado Final

`database/migrations/` volta a descrever integralmente o estado do banco de produção.
Migrations 001–040 versionadas (exceto a 033, obsoleta e nunca aplicada — ver nota em `REFERENCE.md`).

---

## Risco de Regressão

**Alto enquanto o processo não mudar.** Nada impede que a próxima migration aplicada via MCP fique
de fora do git outra vez. O erro é silencioso: só aparece se alguém rodar `git status` e comparar
com a documentação.

Consequência concreta se reincidir: reconstruir o banco a partir do repositório produz um schema/
estado diferente do de produção, e a justificativa da mudança se perde junto com a máquina.

---

## Prevenção

1. **Commitar a migration antes de aplicá-la**, não depois. O arquivo é a fonte; o Supabase é o
   destino.
2. Incluir `git status --porcelain database/migrations/` na checagem de fim de sessão — saída não
   vazia é bloqueio.
3. Ao ler `REFERENCE.md` e encontrar "migration NNN aplicada", conferir que o arquivo existe **e**
   está rastreado.

---

## Relacionados

- **FC057** — mesma classe: código real existindo apenas localmente e nunca deployado (lá a causa
  era uma regra de `.gitignore`). Ver também **D35**.
- **D37** — decisão que originou a migration 040.
