# .docs 01 — Requisitos Funcionais (RF)

## Objetivo

Listar, de forma numerada e rastreável, o que o RevendaClick deve fazer do ponto de vista do usuário — cada requisito funcional é uma capacidade observável, testável e independente de como é implementada.

> Todos os requisitos (RF-001 a RF-010) foram validados individualmente pelo usuário em 2026-07-06 — descrição, critério de aceite, prioridade e status confirmados ponto a ponto (ver [`memory/DECISOES.md`](../memory/DECISOES.md)). Este documento deixou de ser rascunho de onboarding.

## Quando Utilizar

- Ao planejar uma nova funcionalidade — verificar se já existe um RF relacionado antes de criar um novo.
- Ao escrever um teste de aceite — cada RF deve ser verificável por pelo menos um teste ou critério de aceite.
- Durante revisão de escopo, para confirmar que uma tarefa está de fato dentro do que foi formalmente requisitado.

## Estrutura

Cada requisito tem identificador único (`RF-NNN`), descrição, critério de aceite e prioridade.

### RF-001 — Isolamento multi-tenant

**Descrição**: cada revenda opera em um ambiente totalmente isolado (multi-tenant), identificado por `tenant_id` e `slug`. Todos os dados de negócio pertencem exclusivamente ao respectivo tenant, garantindo isolamento lógico completo entre revendas.
**Critério de aceite**:
- Todo registro de negócio possui `tenant_id`.
- Toda consulta filtra obrigatoriamente pelo `tenant_id`.
- Nenhum usuário consegue visualizar, alterar ou excluir dados de outro tenant.
- O isolamento é garantido também no banco de dados através de Row Level Security (RLS) do Supabase.
- Qualquer tentativa de acesso cruzado deve retornar acesso negado ou conjunto vazio.
**Prioridade**: Alta.
**Status**: Confirmado.

### RF-002 — Vitrine pública de veículos

**Descrição**: cada revenda possui uma vitrine pública própria, identificada por seu slug, permitindo a divulgação do estoque de veículos na internet com URLs amigáveis, otimização para mecanismos de busca (SEO) e acesso público sem necessidade de autenticação.
**Critério de aceite**:
- Cada revenda possui uma URL pública exclusiva.
- Apenas veículos publicados aparecem na vitrine.
- Veículos despublicados deixam de aparecer imediatamente.
- A página exibe no mínimo: fotos; marca; modelo; versão; ano; quilometragem; combustível; câmbio; preço; descrição; cidade/UF; dados de contato da revenda.
- Cada veículo possui URL própria para indexação.
- As páginas possuem metadados SEO (title, description e Open Graph).
- A vitrine deve funcionar sem autenticação.
- A vitrine respeita o isolamento multi-tenant.
**Prioridade**: Alta.
**Status**: Confirmado.

### RF-003 — Gestão de estoque de veículos

**Descrição**: o sistema deve permitir o gerenciamento completo do estoque de veículos da revenda, incluindo cadastro, edição, publicação, despublicação, exclusão lógica, controle de status e gerenciamento de imagens, mantendo todas as informações vinculadas ao tenant proprietário.
**Critério de aceite**:
- Cadastrar, editar, publicar, despublicar e arquivar/excluir logicamente veículos.
- Upload de múltiplas fotos e definição de foto principal.
- Persistir no mínimo: marca; modelo; versão; ano/modelo; quilometragem; combustível; câmbio; cor; categoria; preço; placa (configurável para exibição); chassi (uso interno); RENAVAM (uso interno); opcionais; descrição; cidade/UF; status (Disponível, Reservado, Vendido, Inativo).
- Todo veículo pertence obrigatoriamente a um tenant.
- Todas as alterações são refletidas imediatamente na gestão e, quando publicado, na vitrine pública.
- Não permitir acesso ao estoque de outro tenant.
**Prioridade**: Alta.
**Status**: Confirmado.

### RF-004 — CRM e funil de leads

**Descrição**: o sistema deve permitir o gerenciamento completo do CRM e do funil comercial da revenda, registrando, distribuindo e acompanhando todos os leads captados até a conclusão da venda, mantendo o histórico completo de interações e negociações.
**Critério de aceite**:
- Captar leads da vitrine pública, cadastro manual e contato via WhatsApp da Loja.
- Vincular o lead ao veículo de interesse (quando existir) e ao vendedor responsável; permitir redistribuição manual.
- Registrar data, origem, interações, observações e histórico cronológico.
- Estágios mínimos do funil: Novo; Em atendimento; Negociação; Proposta; Reservado; Vendido; Perdido — com registro do motivo da perda.
- Pesquisa e filtros por vendedor, veículo, origem, estágio e período.
- Todo lead pertence obrigatoriamente ao tenant da revenda; nenhum usuário visualiza leads de outro tenant.
**Prioridade**: Alta.
**Status**: Confirmado.

### RF-005 — Atendimento via WhatsApp

**Descrição**: o RevendaClick possui dois módulos independentes de comunicação via WhatsApp: (1) **WhatsApp da Loja** — disponível em todos os planos, permite contato direto entre cliente e revenda através de link `wa.me`, sem integração; (2) **Central de Atendimento** — módulo premium baseado na Evolution API, contratado separadamente como add-on, permitindo atendimento centralizado, múltiplos atendentes, histórico de conversas e futuras automações.
**Critério de aceite**:
- *MVP (WhatsApp da Loja)*: configurar número oficial da revenda; exibir botão "Conversar no WhatsApp" na vitrine pública; abrir conversa via `wa.me`; funcionar sem integração externa; respeitar o tenant da revenda.
- *Pós-MVP (Central de Atendimento)*: conectar e vincular uma instância Evolution API ao tenant; centralizar atendimentos com múltiplos atendentes; registrar histórico de conversas; permitir futura automação por IA; controlar acesso por feature flag, disponível somente com o add-on ativo.
- Regras: os dois módulos são distintos e um nunca substitui o outro; o WhatsApp da Loja permanece disponível independentemente da contratação da Central; a contratação da Central não altera o funcionamento do WhatsApp da Loja.
**Prioridade**: Alta (WhatsApp da Loja) / Média (Central de Atendimento, add-on).
**Status**: WhatsApp da Loja confirmado no MVP; Central de Atendimento confirmada para roadmap pós-MVP.

### RF-006 — Gestão de vendedores e permissões

**Descrição**: o sistema deve permitir o gerenciamento completo dos usuários da revenda, controlando papéis, permissões e níveis de acesso, garantindo que cada usuário visualize e execute apenas as funcionalidades autorizadas dentro do seu tenant.
**Critério de aceite**:
- Cadastrar, editar, ativar/inativar usuários; definir e alterar papel de acesso; vincular cada usuário obrigatoriamente a um tenant, sem acesso entre tenants.
- Registrar data de criação, último acesso e usuário responsável pela criação.
- Papéis mínimos: **Owner** (controle total: financeiro, configuração, usuários, estoque, CRM, vendedores, relatórios); **Admin** (opera a revenda: usuários exceto Owner, estoque, CRM, vendedores, financeiro operacional); **Seller** (vê apenas seus próprios leads, gerencia suas negociações, atualiza vendas, consulta veículos, não altera configurações nem gerencia usuários); **Viewer** (somente consulta, não cria/altera/exclui).
- Regras: todo usuário pertence a um único tenant; o papel Owner é único por tenant; permissões controladas por RBAC; o Super Admin possui controle fora do tenant e não faz parte desta hierarquia.
**Prioridade**: Alta.
**Status**: Confirmado.

### RF-007 — Financeiro e comissões de vendedores

**Descrição**: o sistema deve permitir o controle financeiro operacional da revenda e o gerenciamento das comissões dos vendedores, registrando todas as vendas realizadas, seus valores, responsáveis e situação das comissões, mantendo rastreabilidade completa de cada negociação.
**Critério de aceite**:
- *MVP*: registrar venda vinculada a veículo, cliente e vendedor responsável; registrar valor da venda, custo do veículo, lucro bruto, comissão prevista, comissão paga/pendente, data da venda, forma de pagamento e observações; atualizar automaticamente o status do veículo para "Vendido"; impedir duplicidade de venda do mesmo veículo.
- Campos mínimos da comissão: vendedor; percentual (quando informado); valor previsto; valor pago; status; data prevista; data do pagamento.
- Regras: toda venda e toda comissão pertencem ao tenant; toda comissão está vinculada a uma venda; apenas Owner e Admin alteram informações financeiras; Seller visualiza apenas suas próprias comissões; a regra avançada de cálculo de comissão será documentada posteriormente e **não bloqueia o MVP**.
**Prioridade**: Alta.
**Status**: Controle financeiro operacional e controle básico de comissões confirmados no MVP; regra avançada de cálculo pendente de definição de negócio (ver [`memory/PENDENCIAS.md`](../memory/PENDENCIAS.md)).

### RF-008 — Cobrança recorrente (billing SaaS)

**Descrição**: o sistema deve administrar todo o ciclo de vida da assinatura SaaS de cada revenda, controlando planos, período de trial, status da assinatura, bloqueios operacionais, renovação e preparação para integração completa com o Asaas, preservando uma arquitetura escalável para billing recorrente.
**Critério de aceite**:
- *MVP*: cada tenant possui plano ativo e status de assinatura (Trial, Ativa, Suspensa, Inadimplente, Cancelada); registrar datas de início/término do trial e vencimento da assinatura; alteração manual de plano; bloqueio/desbloqueio manual do tenant; registrar Customer ID e Subscription ID do Asaas (referência), período de carência (Grace Period), data do bloqueio e observações administrativas.
- Regras: toda assinatura pertence a um único tenant; trial, Grace Period e status fazem parte do MVP; o bloqueio ocorre conforme o status da assinatura; Owner e Super Admin alteram informações da assinatura; o modelo de dados suporta múltiplos planos e add-ons sem necessidade de refatoração.
- *Fora do MVP*: cobrança automática via Asaas, webhooks de pagamento, renovação automática, emissão automática de boletos, PIX automático, cobrança de add-ons, upgrade/downgrade automático, automação de cobrança.
**Prioridade**: Alta.
**Status**: Gestão mínima da assinatura SaaS confirmada no MVP; integração completa com Asaas e billing automatizado no roadmap pós-MVP.

### RF-009 — Relatórios gerenciais

**Descrição**: o sistema deve fornecer informações gerenciais para apoiar a tomada de decisão da revenda, disponibilizando indicadores operacionais, comerciais e financeiros baseados exclusivamente nos dados do tenant.
**Critério de aceite**:
- *MVP*: dashboard com indicadores básicos (quantidade de veículos cadastrados, publicados e vendidos; quantidade de leads; vendas realizadas; vendedores ativos), com filtro por período, restrito ao tenant autenticado e atualização automática após alterações relevantes.
- *Pós-MVP*: conversão do funil, performance por vendedor, origem dos leads, tempo médio de venda, ticket médio, lucro por período, comparativos mensais, exportação PDF/Excel, dashboards personalizáveis, gráficos avançados, indicadores financeiros completos.
- Regras: nenhum relatório acessa dados de outro tenant; indicadores refletem exclusivamente o período selecionado.
**Prioridade**: Média.
**Status**: Dashboard operacional básico confirmado no MVP; relatórios gerenciais avançados no roadmap pós-MVP.

### RF-010 — Administração da plataforma (super admin)

**Descrição**: o sistema deve disponibilizar um painel de Super Admin para administração da plataforma SaaS, permitindo gerenciar tenants, planos, assinaturas, recursos habilitados e parâmetros globais, mantendo isolamento total dos dados operacionais de cada revenda.
**Critério de aceite**:
- *MVP*: listar e pesquisar tenants (com filtros por plano, status, trial e período); visualizar informações gerais, plano, status da assinatura e trial; ativar, suspender e reativar tenant; alterar plano manualmente; ativar/desativar feature flags básicas; registrar log administrativo das ações do Super Admin.
- *Pós-MVP*: dashboard executivo da plataforma, métricas SaaS (MRR, ARR, Churn, LTV, CAC), gestão completa de add-ons, billing automatizado, administração de webhooks/integrações, auditoria avançada, monitoramento operacional, administração global de IA/Evolution API/Asaas.
- Regras: o Super Admin não pertence a nenhum tenant e não participa da hierarquia Owner/Admin/Seller/Viewer; acesso a dados operacionais de um tenant só ocorre por funcionalidade específica de impersonação/auditoria, registrada em log; todas as ações do Super Admin são auditáveis.
**Prioridade**: Alta.
**Status**: Painel mínimo de Super Admin confirmado no MVP; recursos avançados de administração da plataforma no roadmap pós-MVP.

## Responsabilidades

- Todo RF novo recebe um identificador sequencial (`RF-NNN`) que nunca é reaproveitado, mesmo que o requisito seja descontinuado.
- RFs descontinuados são marcados como tal, não removidos do documento — isso preserva o histórico de decisão.
- O recorte de MVP por RF está confirmado (ver [`03-mvp.md`](03-mvp.md)); mudanças de escopo depois de iniciada a implementação são decisões registradas em [`08-decisoes-tecnicas.md`](08-decisoes-tecnicas.md), não edições silenciosas aqui.

## Relacionamento com Outros Documentos

- [00-visao-geral.md](00-visao-geral.md) — origem do propósito que estes requisitos concretizam.
- [02-requisitos-nao-funcionais.md](02-requisitos-nao-funcionais.md) — qualidades que a implementação destes RFs deve respeitar.
- [03-mvp.md](03-mvp.md) — subconjunto de RFs priorizado para a primeira entrega.
- [05-regras-negocio.md](05-regras-negocio.md) — regras que governam o comportamento destes requisitos.
