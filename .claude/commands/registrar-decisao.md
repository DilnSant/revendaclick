---
description: Registra uma decisão técnica em docs-operacao/21_DECISOES_TECNICAS.md
argument-hint: <descrição breve da decisão>
---

# /registrar-decisao

## Objetivo

Registrar uma decisão técnica em [`docs-operacao/21_DECISOES_TECNICAS.md`](../../docs-operacao/21_DECISOES_TECNICAS.md) no momento em que é tomada, em vez de depender de lembrar disso apenas no encerramento da sessão.

## Estrutura — execute nesta ordem

1. **Coletar** (do usuário ou da conversa): título, decisão tomada, motivo, trade-off aceito e — quando houver — a regra operacional que passa a valer.
2. **Conferir o último número `D`** já usado no arquivo (`grep "^## D" docs-operacao/21_DECISOES_TECNICAS.md | tail -1`) e usar o próximo na sequência.
3. **Acrescentar ao final** de `docs-operacao/21_DECISOES_TECNICAS.md`, no formato já usado no arquivo:

   ```markdown
   ## D<n> — <título> (DD/MM/AAAA — sessão <n> ou FC<n>)

   **Decisão:** <o que passa a valer>

   **Por quê:** <justificativa, com a evidência que levou a ela>

   **Trade-off:** <o que se perde ao aceitar esta decisão>
   ```

   Campos opcionais quando fizerem sentido, seguindo o padrão de D35: **Regra operacional** (o que fazer/não fazer daqui em diante) e **Auditoria recomendada** (como verificar que a regra está sendo cumprida).
4. **Confirmar ao usuário**, mostrando o trecho adicionado.
5. Se a decisão alterar uma regra de negócio ou de produto (não apenas técnica), sinalizar que [`docs-produto/`](../../docs-produto/) também pode precisar de ajuste.

## Responsabilidades

- Não registrar de forma vaga ("melhoramos o código") — exigir motivo e trade-off mínimos.
- Não sobrescrever nem renumerar decisões existentes: o arquivo é um log cronológico. Uma decisão revertida ganha uma **nova** entrada que a substitui explicitamente.
- Se a decisão contradiz uma decisão anterior, citá-la pelo número (`D<n>`) e explicar o que mudou.

## Relacionamento com Outros Documentos

- [docs-operacao/21_DECISOES_TECNICAS.md](../../docs-operacao/21_DECISOES_TECNICAS.md) — destino do registro.
- [docs-produto/](../../docs-produto/) — destino complementar quando a decisão for de produto ou regra de negócio.
- [/encerrar-sessao](encerrar-sessao.md) — verifica, no fim da sessão, se as decisões foram registradas.
