# 01 — PROMPT DE ENCERRAMENTO DE SESSÃO

Use este prompt ao final de uma sessão.

---

## Prompt

Encerrar sessão.

Antes de finalizar:

1. Informe o que foi feito.
2. Liste os arquivos alterados.
3. Liste validações executadas.
4. Informe se houve alteração de código.
5. Informe se houve alteração de banco.
6. Informe se houve alteração de documentação.
7. Informe se houve deploy.
8. Informe riscos restantes.
9. Informe pendências abertas.
10. Informe o próximo passo recomendado.

Se houve mudança de comportamento, verifique se estes documentos precisam ser atualizados:

- `docs-operacao/MEMORY.md`
- `docs-operacao/20_PENDENCIAS.md`
- `docs-operacao/21_DECISOES_TECNICAS.md`
- `docs-operacao/22_HISTORICO_ALTERACOES.md`
- `docs-operacao/23_PROXIMO_PASSO.md`
- `docs-operacao/REFERENCE.md`
- `docs-operacao/PRODUCT_ARCHITECTURE.md`
- `docs-operacao/DEPENDENCIES.md`
- `docs-operacao/ENVIRONMENTS.md`

Se algum bug foi corrigido, verificar se precisa registrar em:

- `docs-operacao/FalhasCorrigidas/`

Não diga que validou algo se o comando não foi executado.

Formato final:

STATUS: RESOLVIDO | PARCIAL | PENDENTE

1. Feito
2. Arquivos alterados
3. Validações
4. Documentação
5. Pendências
6. Riscos
7. Próximo passo

Não altere arquivos sem autorização.
Não faça commit sem autorização.
Não faça push sem autorização.
Não faça deploy sem autorização.

Ao final, gere um prompt curto para iniciar a próxima sessão.
