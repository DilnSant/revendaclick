# .docs 05 — Regras de Negócio

## Objetivo

Registrar as regras que governam o comportamento do domínio do RevendaClick, independentemente de qualquer tela ou endpoint específico — a lógica que responde "o que é permitido acontecer" no sistema.

> Validado regra a regra com o usuário em 2026-07-31. Só são registradas aqui regras efetivamente confirmadas — **regras não confirmadas não são inventadas**, ficam como pendência em [`memory/PENDENCIAS.md`](../memory/PENDENCIAS.md).

## Quando Utilizar

- Ao implementar uma validação ou fluxo que decide se uma ação é permitida.
- Ao revisar se uma funcionalidade nova respeita uma regra já estabelecida.
- Ao investigar um comportamento inesperado do sistema — a primeira pergunta é "qual regra deveria ter impedido isso?".

## Estrutura

### Regras confirmadas

**RN-001 — Isolamento absoluto por tenant.** Nenhuma operação pode ler ou escrever dados de um tenant diferente do tenant do usuário autenticado. O isolamento é defendido em camadas (JWT + filtro na aplicação + RLS no banco); a falha de uma camada não pode expor dados.

**RN-002 — WhatsApp da Loja ≠ Central de Atendimento.** São dois recursos distintos e não intercambiáveis: "WhatsApp da Loja" é um link `wa.me` disponível a todos os planos; "Central de Atendimento" é integração via Evolution API, oferecida como add-on pago. Nunca tratar um como o outro (a confusão entre ambos já causou erro de classificação de risco na versão anterior).

**RN-003 — Papéis determinam o que cada usuário pode fazer.** Os papéis `owner`, `admin`, `seller` e `viewer` definem permissões distintas; um `viewer` não altera dados e um `seller` acessa apenas o previsto para seu papel.

**RN-004 — Visibilidade de veículo depende de publicação.** Um veículo só aparece na vitrine pública quando está publicado; despublicar remove-o da vitrine sem excluí-lo do estoque.

**RN-005 — Acesso do tenant depende da assinatura.** O acesso às funcionalidades do tenant depende de uma assinatura ativa. Novo tenant recebe 30 dias de trial. Ao entrar em inadimplência (`past_due`), a assinatura tem 7 dias de carência antes do bloqueio efetivo de acesso; o cliente recebe e-mail de aviso 7 dias antes do vencimento da fatura.

**RN-006 — Plano Scale/Enterprise oculto do grid público.** O plano de maior nível não aparece no grid público de planos; é disponibilizado apenas via contato comercial direto.

**RN-007 — Acesso efetivo a uma funcionalidade combina três fontes.** O conjunto de funcionalidades disponível a um tenant é sempre a combinação de (1) features do plano contratado, (2) overrides manuais de Feature Flag concedidos pelo Super Admin, e (3) features concedidas por add-ons ativos — nunca uma fonte isolada determina o acesso.

### Regras a confirmar (não implementar sem definição)

- **Cálculo de comissão de vendedores** (Regra de Comissão): percentual fixo, por faixa ou por vendedor — fórmula de cálculo automático não documentada. No MVP, comissão é registrada por venda apenas como valor previsto e status pago/não pago, sem depender desta regra.

## Responsabilidades

- Toda regra de negócio implementada em código deve ser rastreável a uma entrada aqui — código sem regra documentada é uma lacuna de documentação a ser corrigida, não uma exceção aceitável.
- Regras ainda não confirmadas permanecem na seção "a confirmar" e como pendência, nunca promovidas a regra ativa sem decisão do usuário.
- Mudança de regra existente é uma decisão registrada em [`08-decisoes-tecnicas.md`](08-decisoes-tecnicas.md), não uma edição silenciosa deste documento.

## Relacionamento com Outros Documentos

- [04-modelagem.md](04-modelagem.md) — entidades sobre as quais estas regras operam.
- [01-requisitos-funcionais.md](01-requisitos-funcionais.md) — requisitos que implementam estas regras em funcionalidades concretas.
- [AI_GOVERNANCE/REGRAS_GERAIS.md](../AI_GOVERNANCE/REGRAS_GERAIS.md) — regras de governança da IA, categoria distinta das regras de negócio do produto listadas aqui.
