# 02 — LIÇÕES APRENDIDAS

Este arquivo registra aprendizados para evitar repetição de erros.

---

## Lição 1 — Não criar estrutura grande cedo demais

Criar muitos arquivos de governança aumenta complexidade.

A estrutura inicial deve ser pequena:

- `CLAUDE.md`
- `.claude/`
- `AI_GOVERNANCE/`
- `docs-operacao/`
- `prompts/`
- `memory/`
- `templates/`

Adicionar novos arquivos somente quando houver necessidade real.

---

## Lição 2 — O Claude não deve ler tudo sempre

Leitura completa consome contexto e reduz eficiência.

O correto é:

- classificar a tarefa
- ler contexto mínimo
- executar
- validar
- documentar

---

## Lição 3 — Prompts devem ser curtos

Prompts enormes dificultam execução.

Prompts oficiais devem orientar:

- início
- encerramento
- auditoria
- bug crítico
- deploy

Sem repetir toda a documentação do projeto.

---

## Lição 4 — Correção deve ser cirúrgica

Quando algo estiver parcialmente errado:

- corrigir apenas o trecho errado
- não recriar tudo
- não substituir arquivos sem necessidade

---

## Lição 5 — Terminal precisa de comandos completos

Comandos como `cat > arquivo` deixam o terminal aguardando conteúdo.

O correto é usar:

```bash
cat > arquivo <<'EOF'
conteúdo
