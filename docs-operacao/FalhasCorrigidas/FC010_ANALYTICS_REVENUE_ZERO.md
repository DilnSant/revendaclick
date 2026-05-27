# FC010 — Analytics revenue zerado (colunas SQL inexistentes)

## Data

2026-05-26

## Severidade

MÉDIA

## Sintoma

Módulo de Analytics (`/analytics`) exibia receita `R$ 0,00` para todos os tenants, mesmo com vendas cadastradas. Nenhum erro aparecia — a query retornava normalmente mas com valores zerados.

## Contexto

Módulo Analytics disponível para plano Pro+. Calcula receita total, ticket médio, vendas por período, etc. O problema era silencioso: a query executava sem erro, mas retornava `sum(null) = null → 0` porque as colunas referenciadas não existiam na tabela.

## Causa Raiz

Duas queries SQL em `backend/internal/analytics/repository.go` usavam nomes de colunas incorretos que não existem na tabela `sales`:

```go
// ERRADO — colunas inexistentes:
SUM(final_value)   // não existe — coluna real é sale_price
WHERE completed_at  // não existe — coluna real é sold_at
```

O PostgreSQL com `SELECT SUM(coluna_inexistente)` retorna um erro de compilação. No entanto, em algum momento durante o desenvolvimento, essas queries foram escritas com nomes hipotéticos e nunca validadas contra o schema real da tabela.

**Schema real da tabela `sales`:**
```sql
-- Verificado via: \d sales  no Supabase
sale_price   NUMERIC  -- valor da venda
sold_at      TIMESTAMPTZ  -- data de conclusão
```

## Arquivos Afetados

- `backend/internal/analytics/repository.go` — queries de receita e período

## Banco/Migrations

Nenhuma migration necessária — problema era no código Go, não no schema.

## Correção Aplicada

```go
// ANTES:
query := `SELECT SUM(final_value) as revenue, COUNT(*) as count
          FROM sales
          WHERE tenant_id = $1 AND completed_at >= $2`

// DEPOIS:
query := `SELECT SUM(sale_price) as revenue, COUNT(*) as count
          FROM sales
          WHERE tenant_id = $1 AND sold_at >= $2`
```

Substituições realizadas:
- `final_value` → `sale_price`
- `completed_at` → `sold_at`

## Commit(s)

- `0b32a6dc8a7d313863ac91d412711f35936b7d0c` — fix: sync repo — analytics columns fix (final_value→sale_price, completed_at→sold_at)

## Como Validar

```bash
# 1. Criar uma venda via API e verificar analytics
TOKEN=$(...)
curl -s https://api.revendaclick.com.br/api/analytics/revenue \
  -H "Authorization: Bearer $TOKEN"
# deve retornar receita > 0 se houver vendas cadastradas

# 2. Verificar schema real da tabela
# Supabase SQL Editor:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sales'
ORDER BY ordinal_position;
# confirmar: sale_price (não final_value), sold_at (não completed_at)
```

## Resultado Final

Analytics retorna receita real dos tenants. `sale_price` e `sold_at` são os nomes corretos das colunas.

## Risco de Regressão

**BAIXO.** Fix simples de nome de coluna. Risco: se alguém renomear as colunas no banco sem atualizar o código.

## Prevenção Futura

1. Antes de escrever queries SQL no backend, verificar o schema real via `\d tabela` no Supabase SQL Editor.
2. Adicionar testes de integração que executem as queries de analytics contra um banco real (não mock).
3. Ao renomear colunas no banco, buscar todas as ocorrências no backend antes de aplicar a migration.
