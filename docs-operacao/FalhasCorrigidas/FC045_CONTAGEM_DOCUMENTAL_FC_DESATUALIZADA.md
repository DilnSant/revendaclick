# FC045 — Contagem Documental de FCs Desatualizada

**Data:** 14/06/2026
**Sessão:** 51
**Severidade:** BAIXA
**Área:** Documentação
**Status:** RESOLVIDO

---

## Sintoma

Diagnóstico de abertura da sessão 51 identificou divergência entre três fontes documentais:

- `23_PROXIMO_PASSO.md` dizia: "43 falhas documentadas (FC001–FC043)" e "Próximo número disponível: FC044"
- `FalhasCorrigidas/README.md` listava FC001–FC043 no índice; dizia "próximo número é FC044" nas Regras e no Template
- `REFERENCE.md` já dizia corretamente: "44 (FC001–FC044)" e "Próxima FC: FC045"
- `memory/project_status.md` já dizia corretamente: "44 falhas documentadas... próxima FC045"

FC044 (`FC044_RECLASSIFICACAO_PENDENCIAS_INFRA.md`) havia sido criado na sessão 50 mas `23_PROXIMO_PASSO.md` e `FalhasCorrigidas/README.md` não foram atualizados naquela sessão.

---

## Causa Raiz

**Origem:** Sessão 50 — FC044 foi criado e documentado, mas o protocolo de encerramento não atualizou `23_PROXIMO_PASSO.md` (seção "Documentação de Falhas") nem `FalhasCorrigidas/README.md` (índice, regras, template).

**Por que não foi pego antes:** A sessão 50 tinha caráter de "diagnóstico de abertura — sem alterações de código". O commit `76c6864` que criou FC044 foi o último da sessão, e a atualização dos contadores nos outros arquivos foi omitida.

**Padrão de falha:** Mesmo padrão do FC041 — contador de FCs fica "um atrás" quando uma sessão cria o FC mas não atualiza todos os ponteiros.

---

## Arquivos Afetados

| Arquivo | Campo | Valor incorreto | Valor correto |
|---|---|---|---|
| `docs-operacao/23_PROXIMO_PASSO.md` | Seção "Documentação de Falhas" | "43 falhas (FC001–FC043)" + "Próximo: FC044" | "44 falhas (FC001–FC044)" + "Próximo: FC045" |
| `docs-operacao/FalhasCorrigidas/README.md` | Tabela de índice | FC044 ausente | FC044 adicionado |
| `docs-operacao/FalhasCorrigidas/README.md` | Seção "Regras" | "próximo número disponível é FC044" | "próximo número disponível é FC045" |
| `docs-operacao/FalhasCorrigidas/README.md` | Template | "# Próximo número: FC044" + filename FC044 | "FC045" |
| `docs-operacao/FalhasCorrigidas/README.md` | Seção "Por área" | FC044 ausente; sem seção "Documentação" | Seção "Documentação" criada com FC041 + FC044 |

---

## Correção Aplicada

5 edições documentais (zero alterações de código, banco, infra):

1. `23_PROXIMO_PASSO.md` — count 43→44 + próximo FC044→FC045
2. `FalhasCorrigidas/README.md` — FC044 adicionado ao índice (após FC043)
3. `FalhasCorrigidas/README.md` — seção "Por área" → seção "Documentação" criada (FC041 + FC044)
4. `FalhasCorrigidas/README.md` — Regras: "próximo é FC044" → "próximo é FC045"
5. `FalhasCorrigidas/README.md` — Template: "FC044" → "FC045"

---

## Documentos Atualizados Nesta Sessão

| Arquivo | Ação |
|---|---|
| `docs-operacao/23_PROXIMO_PASSO.md` | Contagem e próximo FC corrigidos |
| `docs-operacao/FalhasCorrigidas/README.md` | FC044 adicionado ao índice + seção "Documentação" + próximo FC045 |
| `docs-operacao/FalhasCorrigidas/FC045_CONTAGEM_DOCUMENTAL_FC_DESATUALIZADA.md` | Este arquivo — criado |
| `docs-operacao/22_HISTORICO_ALTERACOES.md` | FC045 adicionado à tabela de estado e ao histórico |
| `docs-operacao/20_PENDENCIAS.md` | FC045 CONCLUÍDA na seção Documentação |
| `docs-operacao/23_PROXIMO_PASSO.md` | Tabela "Estado Atual" atualizada |
| `docs-operacao/REFERENCE.md` | FC045 adicionado ao registro de FCs; count 44→45 |
| `memory/project_status.md` | Count e próximo atualizados |

---

## Como Validar

```bash
# Contar arquivos FC na pasta
ls docs-operacao/FalhasCorrigidas/FC*.md | wc -l
# Esperado: 45

# Verificar próximo número nos docs
grep "FC046\|FC045" docs-operacao/23_PROXIMO_PASSO.md
grep "FC046\|FC045" docs-operacao/FalhasCorrigidas/README.md
grep "FC046\|FC045" docs-operacao/REFERENCE.md
```

---

## Resultado Final

✓ `23_PROXIMO_PASSO.md` — 44 FCs / próximo FC045
✓ `FalhasCorrigidas/README.md` — FC044 no índice + seção Documentação + próximo FC045
✓ `REFERENCE.md` — count 45 (FC001–FC045) / próximo FC046
✓ `22_HISTORICO_ALTERACOES.md` — FC045 documentado
✓ `memory/project_status.md` — 45 FCs / próximo FC046

---

## Risco de Regressão

**MÉDIO** — padrão recorrente (FC041, FC044, FC045). Mitigação:

**Prevenção futura:** Ao criar qualquer FC, atualizar atomicamente no mesmo commit:
1. `FalhasCorrigidas/README.md` — índice + próximo número + por área
2. `docs-operacao/REFERENCE.md` — total e próximo
3. `docs-operacao/23_PROXIMO_PASSO.md` — seção "Documentação de Falhas"
4. `docs-operacao/22_HISTORICO_ALTERACOES.md` — tabela de estado
5. `docs-operacao/20_PENDENCIAS.md` — CONCLUÍDA
6. `memory/project_status.md` — count atualizado
