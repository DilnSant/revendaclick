# .docs 03 — Escopo do MVP

## Objetivo

Definir o menor conjunto de requisitos funcionais (ver [`01-requisitos-funcionais.md`](01-requisitos-funcionais.md)) que, entregue junto, já produz valor real para uma revenda — evitando tanto o lançamento de algo incompleto demais para ser útil quanto o adiamento indefinido em nome de completude.

> **Escopo confirmado pelo usuário em 2026-07-06** — ver [`memory/DECISOES.md`](../memory/DECISOES.md). O MVP é a primeira entrega operacional da baseline evoluída (não um produto simplificado à parte): módulos avançados (Central de Atendimento, integração completa com Asaas, add-ons pagos, feature flags avançadas) ficam para o roadmap, mas os módulos essenciais de financeiro, billing e administração da plataforma entram no MVP em versão mínima.

## Quando Utilizar

- No início do projeto, para alinhar o que entra na primeira entrega.
- Ao avaliar se uma nova ideia deve entrar agora ou esperar (ver [`07-roadmap.md`](07-roadmap.md)).
- Ao decidir se o produto está "pronto para uso real" pela primeira vez.

## Estrutura

### Escopo oficial do MVP

Núcleo mínimo para uma revenda operar e captar, incluindo versões mínimas dos módulos avançados:

- RF-001 (isolamento multi-tenant).
- RF-002 (vitrine pública de veículos com SEO).
- RF-003 (gestão de estoque de veículos).
- RF-004 (CRM e funil de leads).
- RF-005 — apenas o "WhatsApp da Loja" (link `wa.me`); a "Central de Atendimento" (Evolution API) fica fora do MVP, como add-on posterior.
- RF-006 (gestão de vendedores e permissões).
- RF-007 (financeiro e comissões) — versão mínima: registro de venda, valor do veículo, vendedor responsável, status da negociação, comissão prevista e status de pagamento da comissão (paga/não paga). A regra avançada de cálculo de comissão fica como pendência de negócio para detalhamento posterior (ver [`memory/PENDENCIAS.md`](../memory/PENDENCIAS.md)).
- RF-008 (billing SaaS) — versão mínima: plano da revenda, status da assinatura, período de trial, bloqueio por inadimplência e campo de referência para futura integração com Asaas. Integração completa com Asaas, cobrança automática e add-ons pagos ficam fora do MVP.
- RF-010 (super admin) — versão mínima: visualizar tenants, visualizar plano/status, ativar/desativar tenant, alterar plano manualmente e controlar feature flags básicas. Recursos avançados de super_admin ficam para roadmap posterior.
- RF-009 (relatórios gerenciais) — versão mínima: dashboard operacional básico (veículos cadastrados/publicados/vendidos, quantidade de leads, vendas realizadas, vendedores ativos), com filtro por período. Relatórios gerenciais avançados ficam fora do MVP.

### Explicitamente fora do MVP (adiado para o roadmap, não descartado)

- Central de Atendimento via Evolution API.
- Integração completa com Asaas.
- Cobrança automática.
- Add-ons pagos.
- Relatórios gerenciais avançados (RF-009, além do dashboard operacional básico).
- Inteligência artificial.
- Automação avançada de WhatsApp.
- Publicação automática em múltiplos portais.
- Emissão de nota fiscal.
- Financiamento direto.
- Gestão de oficina/manutenção.
- Aplicativo mobile nativo.

### Critério de saída do MVP

O MVP é considerado entregue quando for possível, de ponta a ponta:

1. Criar/provisionar uma revenda como tenant.
2. Cadastrar usuários da revenda.
3. Cadastrar vendedores.
4. Cadastrar veículos no estoque.
5. Publicar veículos na vitrine pública com SEO.
6. Captar leads pela vitrine.
7. Distribuir leads para vendedores.
8. Acompanhar leads no CRM/funil.
9. Registrar negociação/venda.
10. Registrar comissão prevista e status de pagamento da comissão.
11. Controlar plano/status da revenda no painel super_admin.
12. Bloquear/desbloquear tenant manualmente.
13. Utilizar WhatsApp da Loja via link `wa.me`.
14. Operar tudo com isolamento multi-tenant.
15. Consultar o dashboard operacional básico (estoque, leads, vendas, vendedores ativos).

## Responsabilidades

- O escopo do MVP é decidido pelo responsável do produto (usuário) e não é expandido silenciosamente durante a implementação — qualquer adição é uma decisão registrada em [`08-decisoes-tecnicas.md`](08-decisoes-tecnicas.md).
- Itens fora do MVP não são descartados, são adiados — devem aparecer em [`07-roadmap.md`](07-roadmap.md).

## Relacionamento com Outros Documentos

- [01-requisitos-funcionais.md](01-requisitos-funcionais.md) — universo de requisitos do qual o MVP é um subconjunto.
- [07-roadmap.md](07-roadmap.md) — destino dos itens adiados.
- [AI_GOVERNANCE/PROCESSOS.md](../AI_GOVERNANCE/PROCESSOS.md) — checklist de release usado para validar que o MVP está de fato completo antes de publicar.
