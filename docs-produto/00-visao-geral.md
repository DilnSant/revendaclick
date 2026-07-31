# .docs 00 — Visão Geral do Produto

## Objetivo

Registrar, em um único documento, o que o RevendaClick é, para quem existe e qual problema resolve — a referência que qualquer pessoa (ou o Claude Code) deve ler primeiro para entender o propósito do produto antes de mergulhar em requisitos ou código.

## Quando Utilizar

- No primeiro contato com o projeto, antes de qualquer outro documento de `.docs/`.
- Ao avaliar se uma nova funcionalidade está alinhada ao propósito do produto.
- Ao escrever comunicação externa (README público, material de venda) que precise ser consistente com a visão declarada aqui.

## Estrutura

### Problema

Revendas e concessionárias de veículos hoje operam de forma fragmentada — planilhas, WhatsApp solto, anúncios espalhados em diversos portais e sistemas desconexos. Isso gera retrabalho, perda de oportunidades comerciais, dificuldade de acompanhar vendedores, desorganização de estoque e baixa previsibilidade do negócio.

### Proposta de valor

*(Confirmada explicitamente pelo usuário em 2026-07-06 — ver `memory/DECISOES.md`.)*

O RevendaClick é uma plataforma SaaS multi-tenant, moderna, rápida e 100% em nuvem que centraliza toda a operação comercial de revendas e concessionárias de veículos em um único sistema.

A plataforma integra gestão de estoque, CRM, funil de vendas, atendimento via WhatsApp, publicação de anúncios, gestão de vendedores, financeiro, inteligência artificial para atendimento de leads e cobrança recorrente, eliminando o uso de planilhas, sistemas isolados e processos manuais.

O objetivo é aumentar a produtividade da equipe comercial, reduzir retrabalho, acelerar o atendimento aos clientes, melhorar a conversão de vendas e fornecer uma plataforma escalável para o crescimento da revenda.

### Público-alvo

Revendas independentes de veículos, concessionárias, lojas de motos e empresas que comercializam veículos seminovos e usados.

### Objetivo de negócio

Aumentar a produtividade da equipe comercial, reduzir retrabalho, organizar toda a operação da revenda e aumentar a taxa de conversão de vendas.

### Fora de escopo

*(Confirmado explicitamente pelo usuário em 2026-07-06 — ver `memory/DECISOES.md`.)*

O RevendaClick **não é**:

- ERP contábil.
- Sistema fiscal completo.
- Emissor de Nota Fiscal eletrônica (NF-e/NFS-e).
- Sistema de gestão de oficina ou manutenção.
- Sistema de controle de peças.
- Sistema de financiamento bancário.
- Plataforma de consórcio.
- Plataforma de leilões.
- Marketplace público de compra e venda de veículos.
- DMS completo de montadoras.
- Plataforma de BI corporativo.
- Sistema de gestão de RH.
- Sistema de folha de pagamento.
- Sistema de controle patrimonial.
- Sistema de logística de veículos.
- Sistema de rastreamento veicular.
- Plataforma de CRM genérica para outros segmentos.
- Plataforma de e-commerce.
- Plataforma de gestão financeira empresarial completa.
- Sistema de emissão de boletos independente.
- Plataforma para outras verticais de negócio que não sejam revendas e concessionárias de veículos.

O foco do RevendaClick é exclusivamente centralizar e automatizar toda a operação comercial de revendas e concessionárias de veículos.

### Origem do levantamento

Existe uma versão anterior completa e funcional do RevendaClick, em `/home/dilneysantos/Projetos/Old/revendaclick` (SaaS multi-tenant para revendas de veículos: Go/Gin + Next.js + Supabase, com vitrine pública, CRM, estoque, financeiro, WhatsApp via Evolution API e billing via Asaas). Por instrução explícita do usuário (2026-07-05), essa versão anterior é a fonte oficial para este levantamento. Detalhes de requisitos, modelagem e regras de negócio são desenvolvidos nos documentos seguintes de `.docs/`, não duplicados aqui.

## Responsabilidades

- Manter este documento atualizado é responsabilidade de quem define o produto (product owner, founder, ou equivalente) — não é um documento técnico de manutenção livre pelo time de engenharia.
- Qualquer mudança de escopo relevante o suficiente para alterar este documento deve ser refletida também em [`07-roadmap.md`](07-roadmap.md).

## Relacionamento com Outros Documentos

- [01-requisitos-funcionais.md](01-requisitos-funcionais.md) — detalha, em requisitos concretos, a visão descrita aqui.
- [03-mvp.md](03-mvp.md) — recorte inicial da visão em um escopo entregável.
- [07-roadmap.md](07-roadmap.md) — evolução planejada da visão ao longo do tempo.
- [CLAUDE.md](../CLAUDE.md) — referencia este documento como ponto de entrada da documentação funcional.
