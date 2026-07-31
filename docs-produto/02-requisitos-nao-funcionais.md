# .docs 02 — Requisitos Não Funcionais (RNF)

## Objetivo

Listar as qualidades que o RevendaClick deve ter independentemente da funcionalidade específica: segurança, desempenho, isolamento de dados, disponibilidade e manutenibilidade. Requisitos não funcionais restringem *como* os requisitos funcionais (ver [`01-requisitos-funcionais.md`](01-requisitos-funcionais.md)) podem ser implementados.

> Todos os requisitos (RNF-001 a RNF-006) foram validados individualmente pelo usuário em 2026-07-06 — descrição, critério de aceite, categoria, prioridade e status confirmados ponto a ponto, incluindo metas numéricas (ver [`memory/DECISOES.md`](../memory/DECISOES.md)). Este documento deixou de ser rascunho de onboarding.

## Quando Utilizar

- Ao tomar uma decisão de implementação que envolve trade-off (velocidade vs. robustez, simplicidade vs. flexibilidade).
- Ao revisar se uma solução técnica é aceitável mesmo cumprindo o requisito funcional.
- Durante auditoria de qualidade (ver [`AI_GOVERNANCE/AUDITORIA.md`](../AI_GOVERNANCE/AUDITORIA.md)).

## Estrutura

### RNF-001 — Isolamento de dados entre tenants

**Categoria**: Segurança / Confiabilidade.
**Descrição**: o isolamento de dados entre tenants é um requisito obrigatório da arquitetura do RevendaClick e deve ser garantido por múltiplas camadas independentes de proteção, impedindo qualquer acesso não autorizado entre revendas.
**Critério de aceite**:
- Todo usuário autenticado possui `tenant_id` válido no JWT; toda operação e toda entidade de negócio valida/possui `tenant_id`; todas as consultas filtram obrigatoriamente por ele.
- O banco de dados utiliza Row Level Security (RLS) em todas as tabelas de negócio; o backend nunca desabilita o RLS para operações comuns.
- Nenhum usuário acessa dados de outro tenant; tentativas de acesso cruzado retornam acesso negado ou conjunto vazio.
- O isolamento permanece válido mesmo diante de falha em uma das camadas de proteção; nenhuma funcionalidade pode ser implementada burlando o modelo multi-tenant.
**Regras obrigatórias**: multi-tenancy é requisito arquitetural e não pode ser desativado; RLS é obrigatório em produção; toda nova tabela de negócio possui `tenant_id` e política RLS correspondente; toda nova funcionalidade respeita o isolamento entre tenants.
**Prioridade**: Crítica.
**Status**: Confirmado.

### RNF-002 — Segurança de credenciais e segredos

**Categoria**: Segurança.
**Descrição**: a proteção de credenciais, segredos e informações sensíveis é obrigatória em toda a plataforma. Nenhuma chave, token, senha ou credencial poderá ser armazenada no código-fonte, na documentação versionada ou exposta ao cliente, devendo utilizar exclusivamente mecanismos seguros de configuração por ambiente.
**Critério de aceite**:
- Nenhuma senha em texto puro, nenhuma chave/token hardcoded ou versionado, nenhuma credencial em commits.
- Variáveis sensíveis usam `.env` não versionado ou gerenciador de segredos; `.env` é ignorado pelo Git; apenas `.env.example` é versionado.
- Credenciais de produção e homologação permanecem separadas; logs e respostas de erro nunca exibem segredos.
- Tokens JWT assinados com chave segura; chaves privadas nunca disponibilizadas ao frontend; Service Role do Supabase exclusiva do backend; toda integração externa usa armazenamento seguro de credenciais.
**Regras obrigatórias**: proibido versionar credenciais, usar credenciais reais em exemplos ou expor tokens em documentação; toda nova integração segue [`AI_GOVERNANCE/SEGURANCA.md`](../AI_GOVERNANCE/SEGURANCA.md); auditorias verificam continuamente exposição de segredos.
**Prioridade**: Crítica.
**Status**: Confirmado.

### RNF-003 — Desempenho da vitrine pública

**Categoria**: Desempenho / SEO.
**Descrição**: a vitrine pública do RevendaClick deve oferecer excelente desempenho, alta disponibilidade e otimização para mecanismos de busca (SEO), garantindo rápida apresentação dos veículos e máxima capacidade de indexação e geração de leads.
**Critério de aceite**:
- Páginas renderizadas de forma indexável (SSR); URL amigável e permanente por veículo; metadados SEO completos (title, description, Open Graph, canonical URL).
- Sitemap XML automático e `robots.txt` configurado; imagens otimizadas com lazy loading para galerias; compressão de estáticos e cache para conteúdo público.
- Core Web Vitals dentro das recomendações do Google; tempo médio de carregamento inicial inferior a 2s em banda larga; Largest Contentful Paint (LCP) inferior a 2,5s.
- Vitrine acessível sem autenticação; desempenho de um tenant não interfere nos demais.
**Regras obrigatórias**: SEO é requisito obrigatório da plataforma; toda página pública é indexável e não depende de autenticação; toda nova funcionalidade da vitrine preserva desempenho e SEO.
**Prioridade**: Alta.
**Status**: Confirmado.

### RNF-004 — Disponibilidade do serviço

**Categoria**: Confiabilidade.
**Descrição**: o RevendaClick deve operar com alta disponibilidade, garantindo continuidade da operação comercial das revendas. Falhas em integrações externas não podem comprometer o funcionamento do núcleo da plataforma, devendo ser tratadas por degradação controlada.
**Critério de aceite**:
- Disponibilidade anual mínima de 99,9%; o núcleo permanece operacional mesmo com indisponibilidade de Evolution API, Asaas ou IA.
- Todas as integrações têm tratamento de timeout e de exceções, com logs de erro para operações críticas; usuário recebe mensagem clara quando uma integração está indisponível.
- Funcionalidades não dependentes continuam operando normalmente; o sistema permite reprocessar operações pendentes após o restabelecimento da integração.
- O isolamento entre tenants permanece preservado durante qualquer falha.
**Regras obrigatórias**: nenhuma integração externa pode derrubar a aplicação; toda integração possui retry e timeout configuráveis e registra logs de erro para auditoria; a indisponibilidade de um serviço externo nunca compromete o banco de dados nem o núcleo da plataforma.
**Prioridade**: Crítica.
**Status**: Confirmado.

### RNF-005 — Proteção de dados pessoais (LGPD)

**Categoria**: Conformidade / Segurança de Dados.
**Descrição**: o RevendaClick deve tratar todos os dados pessoais de clientes, leads, usuários e colaboradores em conformidade com a Lei Geral de Proteção de Dados (LGPD), garantindo confidencialidade, integridade, rastreabilidade e acesso apenas por usuários autorizados.
**Critério de aceite**:
- Todo dado pessoal pertence a um tenant; acesso restrito a usuários autorizados, respeitando o RBAC; dados pessoais nunca aparecem em logs.
- Senhas nunca em texto puro; dados sensíveis não enviados ao frontend quando desnecessários; toda comunicação via HTTPS.
- Auditoria das operações críticas envolvendo dados pessoais; usuário pode atualizar seus próprios dados quando autorizado.
- Sistema permite anonimização ou exclusão de dados quando exigido por lei; backups preservam confidencialidade; exportações respeitam as permissões do usuário.
**Regras obrigatórias**: tratamento de dados segue a LGPD; proibido expor dados pessoais entre tenants ou registrar CPF/telefone/e-mail/documentos em logs; dados pessoais usados apenas para finalidades da operação da plataforma; toda nova funcionalidade segue Privacy by Design.
**Prioridade**: Crítica.
**Status**: Confirmado.

### RNF-006 — Manutenibilidade e rastreabilidade

**Categoria**: Manutenibilidade.
**Descrição**: o RevendaClick deve garantir alta manutenibilidade, rastreabilidade e governança técnica, permitindo que toda funcionalidade implementada possa ser relacionada aos requisitos de negócio, decisões arquiteturais e histórico de desenvolvimento, facilitando manutenção, auditoria e evolução contínua da plataforma.
**Critério de aceite**:
- Toda funcionalidade implementada referencia pelo menos um RF e/ou RNF, com identificação única; toda funcionalidade é rastreável até sua origem documental.
- Toda decisão arquitetural relevante é registrada em `memory/DECISOES.md`; toda pendência relevante em `memory/PENDENCIAS.md`; toda alteração de escopo é registrada antes da implementação.
- Toda alteração relevante atualiza a documentação correspondente, mantendo-a consistente com o código desenvolvido.
- A abertura de sessão recupera corretamente o contexto do projeto; o encerramento mantém a memória atualizada sem duplicidade.
**Regras obrigatórias**: nenhuma funcionalidade é implementada sem rastreabilidade documental; cada informação tem uma única fonte oficial; alterações de arquitetura são registradas antes da implementação; alterações de requisitos atualizam obrigatoriamente a documentação correspondente; toda implementação preserva a consistência entre `AI_GOVERNANCE/`, `.docs/`, `memory/` e código-fonte.
**Prioridade**: Alta.
**Status**: Confirmado.

## Responsabilidades

- RNFs são tão vinculantes quanto RFs — uma funcionalidade que viola um RNF não está "quase pronta", está incorreta.
- Conflitos entre RNFs são resolvidos a favor do requisito de maior risco (segurança/isolamento de dados prevalece sobre velocidade de entrega), salvo decisão explícita registrada em [`08-decisoes-tecnicas.md`](08-decisoes-tecnicas.md).

## Relacionamento com Outros Documentos

- [01-requisitos-funcionais.md](01-requisitos-funcionais.md) — funcionalidades restringidas por estas qualidades.
- [AI_GOVERNANCE/SEGURANCA.md](../AI_GOVERNANCE/SEGURANCA.md) — RNFs de segurança derivam das regras ali definidas.
- [08-decisoes-tecnicas.md](08-decisoes-tecnicas.md) — registra exceções justificadas a um RNF.
- [11-contexto-tecnico.md](11-contexto-tecnico.md) — como estas qualidades se traduzem na stack e na arquitetura.
