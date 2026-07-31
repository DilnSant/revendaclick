# .docs 07 — Roadmap

## Objetivo

Comunicar a direção planejada do RevendaClick ao longo do tempo, sequenciando o que vem depois do MVP (ver [`03-mvp.md`](03-mvp.md)) sem prometer datas rígidas para itens ainda não detalhados.

> Validado com o usuário em 2026-07-31, com escopo de MVP já confirmado ([`03-mvp.md`](03-mvp.md)) como base. O arquivo "Roadmap Finalização RevendaClick.docx" da versão anterior ainda não foi analisado em detalhe (ver [`memory/PENDENCIAS.md`](../memory/PENDENCIAS.md)) — não bloqueia este documento.

## Quando Utilizar

- Ao decidir se uma ideia nova deve virar um item de trabalho imediato ou entrar no roadmap para mais tarde.
- Ao comunicar prioridades para quem vai colaborar no projeto.
- Ao revisar, periodicamente, se o roadmap ainda reflete a visão em [`00-visao-geral.md`](00-visao-geral.md).

## Estrutura

### Horizonte atual (fim do PLANEJAMENTO)

- `.docs/07-roadmap.md` é o último documento do estado PLANEJAMENTO (stack, arquitetura, modelagem, regras de negócio, glossário e roadmap já confirmados). Próximo passo: sinalizar início da implementação (transição para DESENVOLVIMENTO).

### MVP (primeira entrega — escopo confirmado)

Ver [`03-mvp.md`](03-mvp.md) para o detalhamento completo. Núcleo: RF-001 a RF-006 completos (isolamento multi-tenant, vitrine pública com SEO, estoque de veículos, CRM/funil de leads, WhatsApp da Loja, gestão de vendedores e permissões), mais versões mínimas de RF-007 (financeiro: comissão prevista e status pago/não pago), RF-008 (billing: plano, status da assinatura, trial de 30 dias, carência de 7 dias antes do bloqueio por inadimplência), RF-009 (dashboard operacional básico) e RF-010 (super_admin mínimo).

### Próximo (pós-MVP)

- Central de Atendimento (Evolution API) como add-on pago.
- Financeiro e comissões de vendedores — regra de cálculo automático (percentual/faixa/por vendedor) ainda não definida (ver [`05-regras-negocio.md`](05-regras-negocio.md)).
- Billing completo: integração completa com Asaas, cobrança automática, add-ons pagos. O e-mail de aviso de vencimento (7 dias antes) já foi implementado no app anterior em produção em 2026-07-31, mas ainda não existe no novo repositório — entra junto com a implementação de billing.

### Depois

- Relatórios gerenciais avançados.
- Painel super admin e feature flags por tenant.
- Landing page comercial própria.

### Backlog de ideias (sem prazo)

- Anúncios integrados em portais externos.
- Recursos de IA no produto (a definir; integração de IA na versão anterior usava OpenRouter).

## Responsabilidades

- O roadmap é revisado a cada release (ver [`AI_GOVERNANCE/PROCESSOS.md`](../AI_GOVERNANCE/PROCESSOS.md), checklist de release) — itens concluídos migram de seção, itens que perderam relevância são removidos com justificativa em [`08-decisoes-tecnicas.md`](08-decisoes-tecnicas.md).
- Não é um compromisso contratual — é uma comunicação de intenção, atualizada com a realidade do projeto.

## Relacionamento com Outros Documentos

- [00-visao-geral.md](00-visao-geral.md) — direção de longo prazo que o roadmap sequencia.
- [03-mvp.md](03-mvp.md) — origem dos itens adiados que aparecem aqui.
- [CHANGELOG.md](CHANGELOG.md) — registro do que efetivamente foi entregue, em contraste com o que foi planejado aqui.
