# 22 — HISTÓRICO DE ALTERAÇÕES

> Registrar toda alteração significativa feita em cada sessão de trabalho.
> Formato: data + o que mudou + por quê + arquivos afetados.

---

## Como Usar

No **início** de cada sessão: ler este arquivo para entender o estado atual.
No **fim** de cada sessão: adicionar uma entrada com as alterações feitas.

---

## 2026-05-22 — Auditoria e documentação completa

**O que foi feito:**
- Auditoria real do repositório (leitura de todos os arquivos-fonte)
- Criação de 11 documentos na raiz: `MAPA_DE_PASTAS.md`, `ARQUITETURA_REAL.md`, `ROTAS_REAIS.md`, `BANCO_REAL.md`, `ENVIRONMENT.md`, `INFRA.md`, `CICD.md`, `DEPLOY.md`, `OBSERVABILIDADE.md`, `AUTENTICACAO_REAL.md`, `FLUXOS_REAIS.md`
- Criação de `/docs-operacao/` com 24 arquivos (memória viva do projeto)
- Correção do branch padrão de `master` → `main` no GitHub via API
- Instalação do `gh` CLI em `~/.local/bin/gh` (sem sudo)
- Geração de `FLUTTERFLOW_MIGRATION.md` com plano de migração de 8 semanas
- Decisão de **cancelar** a migração para FlutterFlow (D12 em `21_DECISOES_TECNICAS.md`)

**Por quê:**
- Projeto não tinha documentação operacional — qualquer desenvolvedor novo ou IA precisava reler todo o código
- Decisão de produto: FlutterFlow não será mais necessário

**Arquivos criados/modificados:**
- `/docs-operacao/` (pasta nova com 24 arquivos)
- `MAPA_DE_PASTAS.md`, `ARQUITETURA_REAL.md`, etc. (raiz)
- `FLUTTERFLOW_MIGRATION.md` (obsoleto — decisão D12)

**Commits relacionados:**
- Ver `git log` para commits desta data

---

## Template para novas entradas

```
## YYYY-MM-DD — Descrição resumida

**O que foi feito:**
- item 1
- item 2

**Por quê:**
- motivação

**Arquivos criados/modificados:**
- caminho/do/arquivo.ext — o que mudou

**Commits relacionados:**
- sha abreviado — mensagem do commit
```

---

> Entradas mais antigas ficam abaixo das mais recentes.
> Não limitar o histórico — nunca apagar entradas.
