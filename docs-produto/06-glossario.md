# .docs 06 — Glossário

## Objetivo

Definir, de forma precisa e única, os termos do domínio do RevendaClick usados em toda a documentação e no código — evitando que a mesma palavra signifique coisas diferentes em documentos diferentes, ou que sinônimos criem ambiguidade sobre se são o mesmo conceito.

## Quando Utilizar

- Ao encontrar um termo do domínio pela primeira vez em qualquer documento.
- Ao nomear uma entidade, variável ou endpoint novo — o nome deve corresponder ao termo já glossado, não a um sinônimo inventado.
- Ao revisar documentação para consistência terminológica.

## Estrutura

Termos em ordem alfabética. Cada termo tem uma única definição — se o termo tem sentidos diferentes em contextos diferentes, isso é, em si, um problema de nomenclatura a ser resolvido (renomear um dos usos), não documentado como "duplo sentido aceito".

| Termo | Definição |
|---|---|
| **Add-on** | Recurso cobrado à parte do plano base (ex.: Central de Atendimento). Ver [`04-modelagem.md`](04-modelagem.md). |
| **Admin** | Papel de usuário com permissões amplas dentro do tenant, abaixo de Owner (não cria/edita/remove Owner). |
| **Assinatura** | Vínculo de um tenant a um plano, com cobrança recorrente (integração de pagamento — Asaas na versão anterior). |
| **Carência (grace period)** | Período de 7 dias após a assinatura entrar em inadimplência, antes do bloqueio efetivo de acesso do tenant. |
| **Central de Atendimento** | Atendimento centralizado de WhatsApp via integração Evolution API, oferecido como add-on pago. **Não confundir** com o "WhatsApp da Loja". |
| **Feature flag** | Habilitação de uma funcionalidade por tenant (`tenant_features`), independente do plano base. |
| **Funil de leads** | Sequência de estágios pelos quais um lead percorre desde a captação até a conversão ou perda. |
| **Instância de WhatsApp** | Conexão técnica (Evolution API) que sustenta a Central de Atendimento de um tenant; nunca exposta na vitrine pública. |
| **Lead** | Contato ou oportunidade comercial captado (via vitrine, WhatsApp ou cadastro manual), pertencente a um tenant. |
| **Owner** | Papel de usuário com controle total do tenant; único por tenant. |
| **Plano** | Nível de assinatura contratado por uma revenda (ex.: starter/pro/premium/scale na versão anterior). |
| **Regra de Comissão** | Configuração que define como a comissão de um vendedor é calculada (percentual ou valor fixo) por venda. |
| **RLS (Row Level Security)** | Mecanismo do Postgres que restringe, no próprio banco, o acesso a linhas por tenant — uma das camadas de isolamento multi-tenant. |
| **Slug** | Identificador legível e único de um tenant, usado na URL pública da vitrine. |
| **Super admin** | Papel de administração no nível da plataforma (gestão de tenants, planos e feature flags), distinto dos papéis internos de um tenant. |
| **Tenant (Revenda)** | Empresa cliente do RevendaClick, unidade de isolamento de dados (identificada por `id` e `slug`). |
| **Trial** | Período de 30 dias de acesso gratuito concedido a um tenant recém-criado, antes da cobrança. |
| **Usuário** | Membro autenticado da equipe de uma revenda, vinculado a um tenant, com um papel (Owner/Admin/Seller/Viewer). |
| **Veículo** | Item de estoque de uma revenda, disponível para venda, reserva ou negociação. |
| **Vendedor** | Usuário de papel `seller`, responsável comercial por leads e vendas, sujeito a regras de comissão. |
| **Viewer** | Papel de usuário somente leitura, sem acesso a leads (informação comercial sensível). |
| **Vitrine** | Página pública (por `slug`), otimizada para SEO, que exibe o estoque de veículos publicados de uma revenda. |
| **WhatsApp da Loja** | Link de contato direto (`wa.me`) exibido na vitrine, disponível a todos os planos. **Não confundir** com a "Central de Atendimento". |

## Responsabilidades

- Nenhum termo novo entra em uso na documentação ou no código sem antes ser adicionado aqui, se representar um conceito de domínio recorrente.
- Sinônimos não intencionais encontrados durante revisão são resolvidos escolhendo um termo canônico e atualizando as demais ocorrências.

## Relacionamento com Outros Documentos

- [04-modelagem.md](04-modelagem.md) — entidades cujos nomes devem corresponder aos termos definidos aqui.
- [05-regras-negocio.md](05-regras-negocio.md) — regras que usam a terminologia definida aqui.
- [00-visao-geral.md](00-visao-geral.md) — visão do produto que emprega estes termos.
