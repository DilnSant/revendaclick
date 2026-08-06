/**
 * Configuração das landing pages segmentadas.
 *
 * Cada segmento tem copy própria — a segmentação só aumenta conversão se a
 * página falar da realidade específica daquele lojista. Texto genérico
 * reaproveitado entre segmentos não converte melhor que a landing principal.
 *
 * REGRA: nada aqui pode prometer recurso que o produto não entrega.
 * Ver docs-operacao/22_HISTORICO_ALTERACOES.md (sessão 64) para a lista do
 * que foi verificado como inexistente (marketplaces, contas a pagar/receber,
 * multiempresa) e não deve reaparecer em copy.
 */

export type Segmento = {
  slug: string
  /** Usado no <title> e no OpenGraph. */
  metaTitle: string
  metaDescription: string
  keywords: string[]
  eyebrow: string
  /** Parte inicial do H1, em branco. */
  h1a: string
  /** Parte final do H1, destacada em vermelho. */
  h1b: string
  sub: string
  /** Dores específicas do segmento — 4 itens. */
  dores: { titulo: string; texto: string }[]
  /** Como o produto resolve — 4 itens, em linguagem de ganho. */
  ganhos: { titulo: string; texto: string }[]
  /** Perguntas extras, específicas do segmento. */
  faq: { q: string; a: string }[]
  /** Fechamento. */
  ctaTitulo: string
  ctaSub: string
}

export const SEGMENTOS: Record<string, Segmento> = {
  'revendas-pequenas': {
    slug: 'revendas-pequenas',
    metaTitle: 'Sistema para revenda pequena | Até 30 veículos | RevendaClick',
    metaDescription:
      'Sistema para revendas de até 30 veículos. Organize estoque, atendimento e financeiro sem planilha e sem equipe de TI. 30 dias grátis, sem cartão.',
    keywords: [
      'sistema para revenda pequena',
      'software para loja de carros pequena',
      'gestão de revenda até 30 veículos',
      'sistema simples para revendedor de veículos',
      'controle de estoque de carros planilha',
    ],
    eyebrow: 'Para revendas de até 30 veículos',
    h1a: 'Sua loja é pequena.',
    h1b: 'Sua bagunça não precisa ser grande.',
    sub: 'Quando é você que atende, negocia, fotografa e fecha, cada minuto perdido em planilha é uma venda que não aconteceu. O RevendaClick organiza tudo sem exigir equipe nem conhecimento técnico.',
    dores: [
      {
        titulo: 'Você faz tudo sozinho',
        texto:
          'Atende, fotografa, anuncia, negocia e ainda tenta lembrar quem ligou ontem. Alguma coisa sempre cai.',
      },
      {
        titulo: 'O WhatsApp é seu CRM',
        texto:
          'O contato do cliente está misturado com mensagem de família e grupo de bairro. Achar a conversa vira garimpo.',
      },
      {
        titulo: 'A planilha nunca está certa',
        texto:
          'Você atualiza quando dá. Aí o preço no anúncio não bate com o da planilha, que não bate com o que você lembra.',
      },
      {
        titulo: 'Não dá para saber se está lucrando',
        texto:
          'Entrou dinheiro no mês. Quanto disso é lucro depois do custo do carro, da despesa e da comissão? Ninguém sabe.',
      },
    ],
    ganhos: [
      {
        titulo: 'Pronto em uma tarde',
        texto:
          'Cadastra a loja, sobe os veículos e já sai com vitrine no ar. Sem implantação, sem consultor, sem curso.',
      },
      {
        titulo: 'Um lugar só para os contatos',
        texto:
          'Todo interessado entra numa lista com o que ele quer e quando você prometeu retorno. Acabou o garimpo.',
      },
      {
        titulo: 'Estoque que se atualiza sozinho',
        texto:
          'Vendeu, sai da vitrine. Mudou o preço, muda em todo lugar. Um cadastro, não três.',
      },
      {
        titulo: 'O lucro na tela',
        texto:
          'Custo do carro, valor de venda e despesa amarrados. Você vê a margem real de cada negócio.',
      },
    ],
    faq: [
      {
        q: 'Tenho só 12 carros. Não é sistema demais para mim?',
        a: 'O plano Starter foi feito exatamente para esse tamanho. Se você perde um negócio por mês por não ter dado retorno, a assinatura já se paga — e o trabalho de organizar 12 carros é muito menor do que o de organizar 60 depois que a bagunça cresceu.',
      },
      {
        q: 'Não sou bom com computador. Vou conseguir usar?',
        a: 'A plataforma foi desenhada para ser usada no celular, no balcão, entre um atendimento e outro. Se você usa WhatsApp e tira foto com o telefone, você consegue usar o RevendaClick.',
      },
      {
        q: 'Trabalho sozinho. Preciso pagar por usuário?',
        a: 'Não. O plano já inclui seu acesso. Se um dia contratar um vendedor, você adiciona um usuário extra quando precisar — e só a partir daí.',
      },
    ],
    ctaTitulo: 'Organize sua loja antes que ela cresça bagunçada.',
    ctaSub:
      'É mais fácil colocar ordem em 15 veículos hoje do que em 50 daqui a um ano. Comece com 30 dias grátis.',
  },

  multimarcas: {
    slug: 'multimarcas',
    metaTitle: 'Sistema para multimarcas | Gestão de equipe e comissões | RevendaClick',
    metaDescription:
      'Sistema para revendas multimarcas: controle de equipe, comissões automáticas, funil de vendas e estoque integrado. 30 dias grátis, sem cartão.',
    keywords: [
      'sistema para multimarcas',
      'software para revenda multimarcas',
      'controle de comissões de vendedores veículos',
      'gestão de equipe revenda de carros',
      'CRM para loja de veículos',
    ],
    eyebrow: 'Para revendas multimarcas',
    h1a: 'Você tem equipe.',
    h1b: 'Mas sabe mesmo quem está vendendo?',
    sub: 'Com mais de um vendedor no salão, o problema deixa de ser falta de cliente e passa a ser falta de controle. Quem atendeu, quem deu retorno, quem merece a comissão.',
    dores: [
      {
        titulo: 'Ninguém sabe de quem é o lead',
        texto:
          'O cliente volta na semana seguinte e é atendido por outro vendedor, que recomeça a conversa do zero. Cliente percebe.',
      },
      {
        titulo: 'A comissão sempre gera discussão',
        texto:
          'Todo fim de mês você recalcula na mão e alguém contesta. Some tempo seu e confiança da equipe.',
      },
      {
        titulo: 'Você não sabe quem performa',
        texto:
          'Tem a impressão de quem vende mais, mas não tem número. Sem dado, não dá para cobrar nem para premiar direito.',
      },
      {
        titulo: 'Cada vendedor tem seu método',
        texto:
          'Um anota no caderno, outro no bloco de notas, outro na cabeça. Se sai da equipe, leva a carteira junto.',
      },
    ],
    ganhos: [
      {
        titulo: 'Cada lead com dono e prazo',
        texto:
          'O atendimento fica registrado no cliente, não no vendedor. Qualquer um assume a conversa sabendo onde parou.',
      },
      {
        titulo: 'Comissão que sai da venda',
        texto:
          'A regra é cadastrada uma vez e o cálculo vem do negócio fechado. Acaba a planilha e acaba a discussão.',
      },
      {
        titulo: 'Ranking com número real',
        texto:
          'Quem atendeu mais, quem converteu mais, quem deixou lead esfriar. Cobrança com dado na mesa.',
      },
      {
        titulo: 'A carteira é da loja',
        texto:
          'Histórico de cliente fica na plataforma. Vendedor sai, a base de relacionamento continua sua.',
      },
    ],
    faq: [
      {
        q: 'Cada vendedor precisa de um acesso próprio?',
        a: 'Sim, e é justamente isso que faz o controle funcionar: cada atendimento fica registrado em nome de quem atendeu. O plano inclui um número de usuários e você adiciona usuários extras conforme a equipe cresce.',
      },
      {
        q: 'O vendedor vai conseguir ver meu financeiro?',
        a: 'Não. As permissões são por papel: vendedor enxerga os clientes e veículos, não o financeiro da loja nem a margem dos negócios. Você define quem vê o quê.',
      },
      {
        q: 'Como funciona o cálculo de comissão?',
        a: 'Você cadastra a regra do vendedor — percentual ou valor fixo — e o sistema aplica sobre a venda registrada. A comissão fica amarrada ao negócio, com status de paga ou não paga.',
      },
    ],
    ctaTitulo: 'Pare de descobrir no fim do mês o que aconteceu no começo.',
    ctaSub:
      'Coloque a equipe inteira no mesmo processo e veja em tempo real quem está fazendo a loja girar.',
  },

  premium: {
    slug: 'premium',
    metaTitle: 'Sistema para grandes revendas | Acima de 100 veículos | RevendaClick',
    metaDescription:
      'Plataforma para revendas de grande porte: automação de atendimento, IA de recuperação, indicadores em tempo real e controle total da operação.',
    keywords: [
      'sistema para grande revenda de veículos',
      'software para concessionária independente',
      'automação de atendimento automotivo',
      'IA para revenda de veículos',
      'gestão de revenda 100 veículos',
    ],
    eyebrow: 'Para operações acima de 100 veículos',
    h1a: 'No seu volume,',
    h1b: 'um ponto percentual vale um carro por mês.',
    sub: 'Quando a operação é grande, o ganho não vem de trabalhar mais. Vem de fechar o vazamento: o lead que ninguém respondeu, o carro que empacou, a negociação que esfriou sem alguém perceber.',
    dores: [
      {
        titulo: 'O volume esconde o vazamento',
        texto:
          'Com centenas de contatos por mês, os que se perdem somem no meio. Você só vê o total, nunca o que escapou.',
      },
      {
        titulo: 'Capital travado em carro parado',
        texto:
          'Em um pátio grande, é fácil um veículo passar de 120 dias sem ninguém notar. Cada um desses é dinheiro dormindo.',
      },
      {
        titulo: 'Gestão vira relatório de fim de mês',
        texto:
          'Quando o número chega, o mês já acabou. Você corrige olhando para trás, nunca durante.',
      },
      {
        titulo: 'A equipe cresceu, o processo não',
        texto:
          'O que funcionava com três vendedores desmonta com dez. Sem processo, cada contratação aumenta o caos.',
      },
    ],
    ganhos: [
      {
        titulo: 'IA que resgata o que esfriou',
        texto:
          'A inteligência artificial identifica negociação parando e traz de volta para a fila, com sugestão de próxima ação.',
      },
      {
        titulo: 'Idade de estoque na tela',
        texto:
          'Veículo parado aparece antes de virar prejuízo. Você decide girar com desconto enquanto ainda dá margem.',
      },
      {
        titulo: 'Indicador durante o mês',
        texto:
          'Painel em tempo real por vendedor, origem de lead e conversão. Corrige a rota no dia 10, não no dia 30.',
      },
      {
        titulo: 'Processo que aguenta escala',
        texto:
          'Funil, permissões e histórico padronizados. Vendedor novo entra e opera do mesmo jeito que o resto do time.',
      },
    ],
    faq: [
      {
        q: 'A plataforma aguenta o volume da minha operação?',
        a: 'Sim. A arquitetura é multi-tenant com isolamento por loja e os dados da sua revenda ficam separados de qualquer outra. O plano Premium libera os recursos de automação e IA pensados justamente para volume alto.',
      },
      {
        q: 'Consigo integrar com sistemas que já uso?',
        a: 'O acesso via API está disponível no plano Scale. Se você tem uma necessidade específica de integração, fale com a gente durante o teste para avaliarmos o cenário antes de você decidir.',
      },
      {
        q: 'Como funciona a IA na prática?',
        a: 'Ela atua em três frentes: classifica o interesse do lead para priorizar quem está pronto para fechar, identifica negociações esfriando e sugere a próxima mensagem com base no contexto da conversa. Quem envia continua sendo sua equipe.',
      },
    ],
    ctaTitulo: 'No seu volume, o que escapa não é pouco.',
    ctaSub:
      'Feche o vazamento da sua operação e transforme percentual de conversão em carro vendido.',
  },

  'crm-automotivo': {
    slug: 'crm-automotivo',
    metaTitle: 'CRM automotivo | Funil de vendas para revendas | RevendaClick',
    metaDescription:
      'CRM feito para revenda de veículos: funil de vendas, histórico por cliente, atendimento por WhatsApp e nenhum lead perdido. 30 dias grátis.',
    keywords: [
      'CRM automotivo',
      'CRM para revenda de veículos',
      'funil de vendas automotivo',
      'gestão de leads de veículos',
      'follow-up de clientes revenda de carros',
    ],
    eyebrow: 'CRM para revendas de veículos',
    h1a: 'O lead chegou.',
    h1b: 'Alguém deu retorno?',
    sub: 'A maior parte das vendas perdidas não é por preço. É por demora e por esquecimento. Um CRM feito para revenda resolve exatamente esses dois.',
    dores: [
      {
        titulo: 'O contato chega e some',
        texto:
          'Mensagem no WhatsApp, ligação, formulário do site. Cada um em um canto e nenhum lugar que junte tudo.',
      },
      {
        titulo: 'Ninguém sabe o que já foi falado',
        texto:
          'O cliente retorna e precisa repetir o que quer. Cada repetição derruba a chance de fechar.',
      },
      {
        titulo: 'Follow-up depende de memória',
        texto:
          '"Te ligo na quinta" vira promessa que ninguém anotou. Na quinta, o cliente lembra. Você não.',
      },
      {
        titulo: 'Você não sabe de onde vem venda',
        texto:
          'Investe em anúncio sem saber qual canal traz cliente que fecha. Aposta no escuro todo mês.',
      },
    ],
    ganhos: [
      {
        titulo: 'Todo lead em um funil',
        texto:
          'Do primeiro contato ao fechamento, cada interessado ocupa uma etapa visível. O que travou aparece.',
      },
      {
        titulo: 'Histórico completo por cliente',
        texto:
          'Tudo que foi conversado fica registrado. Quem assume a conversa entra sabendo o contexto inteiro.',
      },
      {
        titulo: 'Atendimento por WhatsApp integrado',
        texto:
          'A central conecta o número da loja ao CRM: a conversa vira histórico automaticamente.',
      },
      {
        titulo: 'Origem de cada negócio',
        texto:
          'Você vê qual canal gera lead que vira venda e para de gastar no que só gera curioso.',
      },
    ],
    faq: [
      {
        q: 'Preciso trocar meu número de WhatsApp?',
        a: 'Não. A Central de Atendimento conecta o número que sua loja já usa. O cliente continua falando no mesmo contato de sempre — a diferença é que a conversa passa a virar histórico dentro do CRM.',
      },
      {
        q: 'É um CRM genérico adaptado para carro?',
        a: 'Não. O funil, os campos e os relatórios são de revenda: interesse por veículo, proposta, troca, e a negociação amarrada ao carro do seu estoque. CRM genérico obriga você a adaptar seu processo ao software.',
      },
      {
        q: 'A Central de Atendimento está em qual plano?',
        a: 'Ela faz parte do plano Premium e também pode ser contratada como recurso adicional em outros planos. O CRM e o funil de vendas em si estão disponíveis a partir do plano Pro.',
      },
    ],
    ctaTitulo: 'Cada hora sem resposta derruba sua chance de fechar.',
    ctaSub:
      'Coloque todo lead em um funil com dono e prazo. Comece com 30 dias grátis, sem cartão.',
  },

  'erp-automotivo': {
    slug: 'erp-automotivo',
    metaTitle: 'ERP automotivo | Gestão completa da revenda | RevendaClick',
    metaDescription:
      'ERP para revendas de veículos: estoque, financeiro, vendas, comissões e indicadores integrados em uma plataforma só. 30 dias grátis, sem cartão.',
    keywords: [
      'ERP automotivo',
      'ERP para revenda de veículos',
      'sistema de gestão para loja de carros',
      'controle financeiro revenda de veículos',
      'fluxo de caixa loja de carros',
    ],
    eyebrow: 'Gestão completa da operação',
    h1a: 'Cinco sistemas que não se falam',
    h1b: 'custam mais caro que um que funciona.',
    sub: 'Estoque num lugar, financeiro em outro, venda numa planilha e comissão na cabeça. O retrabalho de manter tudo sincronizado é o custo que ninguém coloca no papel.',
    dores: [
      {
        titulo: 'O mesmo dado digitado três vezes',
        texto:
          'Cadastra o carro no controle, de novo no anúncio e de novo na planilha de venda. Erra em um, desalinha todos.',
      },
      {
        titulo: 'Financeiro desconectado da venda',
        texto:
          'Você sabe quanto entrou no caixa, mas não de qual carro veio nem quanto sobrou depois do custo.',
      },
      {
        titulo: 'Fechamento é um dia perdido',
        texto:
          'Todo mês vira uma operação de consolidar número de fonte diferente para descobrir o que já deveria estar pronto.',
      },
      {
        titulo: 'Decisão sem base',
        texto:
          'Sem dado confiável e no tempo certo, a gestão vira intuição. Às vezes acerta. Frequentemente, não.',
      },
    ],
    ganhos: [
      {
        titulo: 'Um cadastro para tudo',
        texto:
          'O veículo é cadastrado uma vez e alimenta vitrine, negociação, venda e financeiro. Sem redigitação.',
      },
      {
        titulo: 'Financeiro amarrado ao carro',
        texto:
          'Custo, venda, despesa e comissão ligados ao mesmo veículo. A margem real de cada negócio fica visível.',
      },
      {
        titulo: 'Fluxo de caixa sempre pronto',
        texto:
          'Entradas e saídas registradas na operação, não depois. O fechamento deixa de ser um evento.',
      },
      {
        titulo: 'Indicadores confiáveis',
        texto:
          'Como tudo vem da mesma base, o número do painel é o número real — não a soma de três planilhas.',
      },
    ],
    faq: [
      {
        q: 'Preciso migrar tudo de uma vez?',
        a: 'Não. A maioria começa pelo estoque e pelo atendimento, que é onde o retorno aparece mais rápido, e traz o financeiro em seguida. Durante os 30 dias de teste você faz isso no seu ritmo.',
      },
      {
        q: 'O sistema emite nota fiscal?',
        a: 'A emissão de nota não faz parte da plataforma hoje. O RevendaClick cobre a gestão da operação — estoque, atendimento, vendas, financeiro e comissões — e você continua emitindo nota pelo caminho que já usa.',
      },
      {
        q: 'Consigo controlar despesas da loja, e não só das vendas?',
        a: 'Sim. O módulo financeiro registra entradas e saídas da operação, o que forma o fluxo de caixa. Despesas ligadas a um veículo específico podem ser amarradas a ele, para você ver a margem real daquele negócio.',
      },
    ],
    ctaTitulo: 'Uma base de dados. Uma versão da verdade.',
    ctaSub:
      'Pare de pagar o custo invisível de manter cinco controles sincronizados na mão.',
  },

  'site-para-revendas': {
    slug: 'site-para-revendas',
    metaTitle: 'Site para revenda de veículos | Vitrine própria online | RevendaClick',
    metaDescription:
      'Site próprio para sua revenda, com vitrine de veículos, otimizado para busca e integrado ao seu estoque. Incluído em todos os planos. 30 dias grátis.',
    keywords: [
      'site para revenda de veículos',
      'site para loja de carros',
      'vitrine online de veículos',
      'criar site para revendedora',
      'página de veículos para revenda',
    ],
    eyebrow: 'Presença digital própria',
    h1a: 'Seu estoque merece um endereço',
    h1b: 'que seja seu.',
    sub: 'Enquanto sua loja existe só dentro do perfil de rede social e do classificado, quem manda no seu cliente é a plataforma dos outros. Ter um site próprio muda quem controla a relação.',
    dores: [
      {
        titulo: 'Sua loja mora na casa dos outros',
        texto:
          'Se a plataforma muda a regra ou derruba seu anúncio, você perde o canal e não leva o cliente junto.',
      },
      {
        titulo: 'Você compete lado a lado com o preço',
        texto:
          'No classificado, o cliente compara só número. Não existe sua loja, sua reputação, seu atendimento.',
      },
      {
        titulo: 'Mandar veículo por WhatsApp é trabalhoso',
        texto:
          'Foto por foto, dado por dado, a cada cliente. O mesmo trabalho repetido dezenas de vezes por semana.',
      },
      {
        titulo: 'Ninguém acha você no Google',
        texto:
          'Quem procura revenda na sua cidade encontra concorrente. Você não aparece porque não existe endereço para achar.',
      },
    ],
    ganhos: [
      {
        titulo: 'Vitrine no ar junto com o estoque',
        texto:
          'Cadastrou o veículo, ele aparece no seu site. Vendeu, sai. Sem publicar duas vezes.',
      },
      {
        titulo: 'Um link por veículo',
        texto:
          'Cada carro tem sua página. Você manda o link no WhatsApp e o cliente vê fotos e ficha completa.',
      },
      {
        titulo: 'Sua marca, não a da plataforma',
        texto:
          'Logo, cores e contato da sua loja. O cliente lembra de você, não do classificado onde te achou.',
      },
      {
        titulo: 'Preparado para busca',
        texto:
          'As páginas saem com estrutura e dado organizado para o Google entender o que você vende.',
      },
    ],
    faq: [
      {
        q: 'Preciso contratar alguém para fazer o site?',
        a: 'Não. A vitrine já vem pronta com a plataforma. Você preenche os dados da loja, sobe o logo, escolhe a cor e cadastra os veículos — o site fica no ar sem nenhuma etapa de desenvolvimento.',
      },
      {
        q: 'Posso usar meu próprio domínio?',
        a: 'Sua loja recebe um endereço próprio dentro da plataforma assim que você publica. Se você já tem um domínio da sua revenda e quer usá-lo, fale com a gente durante o teste para avaliarmos o seu caso.',
      },
      {
        q: 'Vou parar de anunciar nos classificados?',
        a: 'Não precisa, e nem recomendamos de saída. O site próprio não substitui o classificado: ele te dá um lugar que é seu, para onde você leva o cliente que veio de qualquer canal — inclusive do anúncio.',
      },
    ],
    ctaTitulo: 'Tenha um lugar na internet que ninguém pode tirar de você.',
    ctaSub:
      'Sua vitrine no ar hoje, com seu estoque e sua marca. Incluída em todos os planos.',
  },
}

/** Slugs reservados — não podem ser usados como slug de loja (colidem com rotas). */
export const SLUGS_RESERVADOS = Object.keys(SEGMENTOS)
