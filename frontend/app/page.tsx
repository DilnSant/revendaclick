import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RevendaClick — A plataforma que acelera sua revenda',
  description: 'CRM, estoque, leads, WhatsApp e financeiro em um só lugar. Teste grátis por 30 dias.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Image
            src="/logo.png"
            alt="RevendaClick"
            width={160}
            height={44}
            className="h-9 w-auto object-contain"
            priority
          />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Entrar
            </Link>
            <Link href="/register" className="btn-primary">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-graphite pt-20 pb-24">
        {/* Background gradient accent */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary-light tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              30 dias grátis — sem cartão de crédito
            </span>

            <h1 className="mt-4 text-4xl font-heading font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              A plataforma que{' '}
              <span className="text-primary">acelera</span>{' '}
              sua revenda
            </h1>

            <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
              CRM completo, gestão de estoque, captação de leads via WhatsApp e controle financeiro — tudo em uma única plataforma pensada para revendas de veículos.
            </p>

            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/register" className="btn-primary-lg w-full sm:w-auto">
                Crie sua conta e comece a vender mais hoje
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Já tenho conta →
              </Link>
            </div>

            {/* Trust stats */}
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {[
                { value: '400+', label: 'Revendas ativas' },
                { value: '12k+', label: 'Veículos cadastrados' },
                { value: '98%', label: 'Satisfação' },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-heading font-bold text-white">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14">
            <h2 className="section-title">Tudo que sua revenda precisa para vender mais</h2>
            <p className="section-subtitle mt-3 max-w-2xl mx-auto">
              Uma plataforma completa que substitui planilhas, cadernos e sistemas separados.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-hover p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  {f.icon}
                </div>
                <h3 className="text-base font-heading font-bold text-graphite">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14">
            <h2 className="section-title">Planos para todo tamanho de revenda</h2>
            <p className="section-subtitle mt-3">Comece grátis. Faça upgrade quando crescer.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <div key={p.name} className={`card p-6 flex flex-col ${p.featured ? 'ring-2 ring-primary' : ''}`}>
                {p.featured && (
                  <span className="mb-3 self-start rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-white">
                    Mais popular
                  </span>
                )}
                <h3 className="text-lg font-heading font-bold text-graphite">{p.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-heading font-bold text-graphite">R${p.price}</span>
                  <span className="text-sm text-gray-500">/mês</span>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {p.features.map((ft) => (
                    <li key={ft} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {ft}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={p.featured ? 'btn-primary w-full text-center' : 'btn-secondary w-full text-center'}
                >
                  Começar grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="bg-graphite py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-heading font-bold text-white sm:text-4xl">
            Pronto para acelerar sua revenda?
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Junte-se a centenas de revendas que já usam o RevendaClick para vender mais.
          </p>
          <Link href="/register" className="btn-primary-lg mt-8 inline-flex">
            Criar conta grátis agora
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Image src="/logo.png" alt="RevendaClick" width={130} height={36} className="h-8 w-auto object-contain" />
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} RevendaClick. Todos os direitos reservados.
          </p>
          <div className="flex gap-5 text-xs text-gray-400">
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacidade</a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'CRM e Kanban de Leads',
    desc: 'Gerencie todos os seus leads em um funil visual. Acompanhe cada oportunidade do primeiro contato ao fechamento.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    title: 'Estoque Completo',
    desc: 'Cadastre veículos com fotos, especificações técnicas e valores. Publique automaticamente na sua página pública.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM7.3 7l1.4-3.6A1 1 0 019.6 3H17a1 1 0 01.9.6L19 7M3 11l1-4h16l1 4v4H3v-4z" />
      </svg>
    ),
  },
  {
    title: 'WhatsApp Integrado',
    desc: 'Receba leads direto pelo WhatsApp e classifique automaticamente com inteligência artificial.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: 'Página Pública da Loja',
    desc: 'Sua vitrine online com SEO otimizado, aparece no Google e gera leads orgânicos sem custo adicional.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    title: 'Controle Financeiro',
    desc: 'Receitas, despesas, comissões e fluxo de caixa. Saiba exatamente quanto sua revenda está lucrando.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Analytics em Tempo Real',
    desc: 'Dashboards com métricas de vendas, ticket médio, taxa de conversão e ranking de vendedores.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '99',
    featured: false,
    features: ['4 usuários', '30 veículos', 'CRM básico', 'Página pública', 'WhatsApp'],
  },
  {
    name: 'Pro',
    price: '199',
    featured: true,
    features: ['8 usuários', '60 veículos', 'CRM completo', 'Analytics', 'WhatsApp + IA'],
  },
  {
    name: 'Premium',
    price: '299',
    featured: false,
    features: ['20 usuários', '120 veículos', 'Tudo do Pro', 'Relatórios avançados', 'Prioridade no suporte'],
  },
  {
    name: 'Enterprise',
    price: '599',
    featured: false,
    features: ['Ilimitado', 'Veículos ilimitados', 'API access', 'White label', 'Suporte dedicado'],
  },
]
