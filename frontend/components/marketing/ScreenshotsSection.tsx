export default function ScreenshotsSection() {
  return (
    <section className="bg-gray-50 py-24" aria-labelledby="screenshots-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            A Plataforma
          </p>
          <h2
            id="screenshots-heading"
            className="font-heading text-3xl font-bold text-graphite sm:text-4xl"
          >
            Uma plataforma completa em cada tela.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Interface intuitiva pensada para quem vende veículos, não para quem
            entende de tecnologia.
          </p>
        </div>

        {/* Featured screenshot */}
        <div className="mt-16">
          <ScreenPlaceholder
            size="large"
            label="Dashboard Principal"
            desc="Visão geral do seu negócio: KPIs de vendas, estoque, leads e financeiro — tudo em tempo real."
            accent="#E53935"
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </div>

        {/* Grid screenshots */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SCREENS.map((s) => (
            <ScreenPlaceholder key={s.label} size="medium" {...s} />
          ))}
        </div>
      </div>
    </section>
  )
}

type ScreenProps = {
  size: 'large' | 'medium'
  label: string
  desc: string
  accent: string
  icon: string
}

function ScreenPlaceholder({ size, label, desc, accent, icon }: ScreenProps) {
  const height = size === 'large' ? 'h-80 sm:h-96' : 'h-52'

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      {/* Screen area */}
      <div className={`${height} relative overflow-hidden bg-gray-50`}>
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          aria-hidden
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Centered icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: `${accent}14` }}
            aria-hidden
          >
            <svg
              className="h-8 w-8"
              style={{ color: accent }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </div>
          <span className="rounded-full border border-dashed border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-400">
            Screenshot em breve
          </span>
        </div>

        {/* Corner decorations */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5" aria-hidden>
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
        </div>

        {/* Accent line at top */}
        <div
          className="absolute left-0 right-0 top-0 h-0.5"
          style={{ background: accent }}
          aria-hidden
        />
      </div>

      {/* Label */}
      <div className="border-t border-gray-100 p-4">
        <h3 className="font-heading text-sm font-bold text-graphite">{label}</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
      </div>
    </div>
  )
}

const SCREENS = [
  {
    label: 'CRM de Leads',
    desc: 'Gerencie todos os contatos em um kanban visual. Mova oportunidades do primeiro contato ao fechamento.',
    accent: '#3B82F6',
    icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
  },
  {
    label: 'Estoque de Veículos',
    desc: 'Cadastro completo com fotos, vídeos, especificações, histórico e preço. Publicação automática na vitrine.',
    accent: '#10B981',
    icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM7.3 7l1.4-3.6A1 1 0 019.6 3H17a1 1 0 01.9.6L19 7M3 11l1-4h16l1 4v4H3v-4z',
  },
  {
    label: 'Controle Financeiro',
    desc: 'Receitas, despesas, comissões e fluxo de caixa — saiba exatamente quanto sua revenda está lucrando.',
    accent: '#F59E0B',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Analytics em Tempo Real',
    desc: 'Métricas de vendas, ticket médio, taxa de conversão e ranking de vendedores. Dados que geram decisões.',
    accent: '#8B5CF6',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    label: 'Vitrine Pública com SEO',
    desc: 'Página da sua loja com URL personalizada, otimizada para o Google. Atraia compradores organicamente.',
    accent: '#E53935',
    icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  },
]
