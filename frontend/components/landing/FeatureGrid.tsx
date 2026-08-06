import {
  Section,
  SectionHead,
  Card,
  Reveal,
  IconUsers,
  IconChat,
  IconCar,
  IconStore,
  IconWallet,
  IconChart,
  IconSpark,
  IconShield,
  IconLock,
} from './ui'

/**
 * Cada card corresponde a uma capacidade que existe no produto hoje.
 * `plano` marca o que é gated — é gancho de upgrade, não promessa vaga.
 * Não incluir aqui nada que ainda não esteja implementado.
 */
const RECURSOS = [
  {
    Icon: IconUsers,
    titulo: 'CRM e pipeline de vendas',
    texto:
      'Cada interessado vira um card no funil. Você enxerga em que etapa está toda negociação e o que precisa de ação hoje.',
    plano: 'Pro',
  },
  {
    Icon: IconChat,
    titulo: 'Atendimento por WhatsApp',
    texto:
      'Central de atendimento conectada ao número da loja, com histórico por cliente. Nenhuma conversa se perde na troca de turno.',
    plano: 'Premium',
  },
  {
    Icon: IconCar,
    titulo: 'Estoque de veículos',
    texto:
      'Cadastro rápido com dados FIPE, fotos e ficha completa. Você sabe o que tem, há quanto tempo está parado e quanto custou.',
  },
  {
    Icon: IconStore,
    titulo: 'Site da loja incluído',
    texto:
      'Vitrine pública própria, com endereço na internet, otimizada para busca e pronta para receber o cliente do anúncio.',
  },
  {
    Icon: IconWallet,
    titulo: 'Financeiro e comissões',
    texto:
      'Entradas, saídas e fluxo de caixa no mesmo lugar da venda. Comissão do vendedor calculada a partir do negócio fechado.',
  },
  {
    Icon: IconChart,
    titulo: 'Dashboard e relatórios',
    texto:
      'Quanto entrou, quanto girou, qual vendedor performou e de onde vieram os leads — sem montar planilha para descobrir.',
    plano: 'Pro',
  },
  {
    Icon: IconSpark,
    titulo: 'IA que recupera negociação',
    texto:
      'A inteligência artificial identifica conversas esfriando, sugere a próxima ação e ajuda a redigir a resposta.',
    plano: 'Premium',
  },
  {
    Icon: IconLock,
    titulo: 'Equipe com permissões',
    texto:
      'Cada pessoa acessa só o que é dela. Vendedor não enxerga o financeiro; você enxerga tudo e sabe quem fez o quê.',
  },
  {
    Icon: IconShield,
    titulo: 'Seus dados protegidos',
    texto:
      'Backup automático diário e isolamento total entre lojas. Os dados da sua revenda são só seus — e continuam seus.',
  },
]

export default function FeatureGrid() {
  return (
    <Section id="recursos">
      <Reveal>
        <SectionHead
          eyebrow="A plataforma"
          title={
            <>
              Tudo que sua revenda precisa,
              <br className="hidden sm:block" /> em um lugar só
            </>
          }
          lead="Sem amarrar cinco sistemas com fita adesiva. Uma plataforma onde atendimento, estoque e financeiro conversam entre si."
        />
      </Reveal>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RECURSOS.map(({ Icon, titulo, texto, plano }, i) => (
          <Reveal key={titulo} delay={i * 60}>
            <Card className="group h-full">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.05] text-primary transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/10">
                  <Icon className="h-5 w-5" />
                </div>
                {plano && (
                  <span className="rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                    {plano}
                  </span>
                )}
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-white">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{texto}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <p className="mt-8 text-center text-xs text-white/35">
          Recursos marcados com Pro ou Premium estão disponíveis nos planos correspondentes.
          Todos os planos começam com 30 dias grátis.
        </p>
      </Reveal>
    </Section>
  )
}
