# FC062 — Preço FIPE não preenchia automaticamente (bloqueado por CSP)

**Área:** Estoque / Frontend
**Severidade:** MÉDIA
**Data:** 31/07/2026
**Sessão:** 61

---

## Sintoma

Ao selecionar a versão do veículo no formulário de cadastro, o texto "Selecionar a versão preenche
automaticamente o Preço FIPE" era exibido, mas o campo de preço nunca era preenchido. Nenhum erro
visível ao usuário.

## Causa Raiz

**Arquivo:** `frontend/components/vehicles/FipeSelects.tsx`, função `fetchFipePrice` (linha ~191)

Das quatro chamadas à API FIPE (marcas, modelos, versões, preço), as três primeiras já passavam por
rotas proxy same-origin do Next.js (`/api/fipe/brands`, `/api/fipe/models`, `/api/fipe/versions`).
Só `fetchFipePrice` fazia `fetch()` **direto do navegador** para `https://parallelum.com.br/...`,
domínio fora da allowlist do `connect-src` do Content-Security-Policy (`frontend/next.config.ts`).
O navegador bloqueava a requisição antes de sair; o `catch { /* ignore */ }` engolia o erro em
silêncio.

## Correção Aplicada

**Commit:** `2a8de19`

Criada a 4ª rota proxy `frontend/app/api/fipe/price/route.ts`, seguindo exatamente o padrão das
outras três. `fetchFipePrice` trocou a chamada direta a `parallelum.com.br` por
`/api/fipe/price?brand=...&model=...&version=...`.

## Como Validar

1. Cadastrar/editar veículo, selecionar marca → modelo → versão.
2. Campo "Preço" deve preencher automaticamente com o valor FIPE.

## Prevenção

Qualquer chamada a API externa feita do lado do cliente (não de uma Route Handler) deve ser
verificada contra a allowlist do CSP em `next.config.ts` antes de ir para produção.
