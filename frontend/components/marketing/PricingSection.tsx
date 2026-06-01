import Link from 'next/link'

export default function PricingSection() {
  return (
    <section className="bg-white py-24" id="planos" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Planos
          </p>
          <h2
            id="pricing-heading"
            className="font-heading text-3xl font-bold text-graphite sm:text-4xl"
          >
            Escolha o plano ideal para sua revenda.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Comece grátis por 30 dias. Sem cartão de crédito, sem surpresas.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col overflow-hidden rounded-2xl border p-8 ${
                plan.featured
                  ? 'border-primary bg-graphite shadow-[0_8px_40px_rgba(229,57,53,0.20)]'
                  : 'border-gray-100 bg-white shadow-card'
              }`}
              aria-label={`Plano ${plan.name}${plan.featured ? ' — Mais popular' : ''}`}
            >
              {plan.featured && (
                <div
                  className="absolute right-0 top-0 rounded-bl-2xl bg-primary px-4 py-1.5 text-xs font-bold text-white"
                  aria-label="Plano mais popular"
                >
                  Mais popular
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`font-heading text-lg font-bold ${
                    plan.featured ? 'text-white' : 'text-graphite'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-2 text-sm ${
                    plan.featured ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {plan.desc}
                </p>
              </div>

              <div className="mb-6">
                <p
                  className={`text-sm font-semibold ${
                    plan.featured ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  Consulte condições comerciais
                </p>
                <div
                  className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    plan.featured
                      ? 'bg-primary/20 text-primary-light'
                      : 'bg-primary-50 text-primary'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  30 dias grátis
                </div>
              </div>

              <ul
                className="mb-8 flex-1 space-y-3"
                aria-label={`Recursos incluídos no plano ${plan.name}`}
              >
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        plan.featured ? 'text-primary' : 'text-primary'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.featured ? 'text-gray-300' : 'text-gray-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={
                  plan.featured
                    ? 'btn-primary w-full justify-center'
                    : 'btn-secondary w-full justify-center'
                }
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-400">
          Precisa de uma solução personalizada?{' '}
          <a
            href="mailto:contato@revendaclick.com.br"
            className="font-semibold text-primary hover:underline"
          >
            Fale com a nossa equipe
          </a>
        </p>
      </div>
    </section>
  )
}

const PLANS = [
  {
    name: 'Starter',
    desc: 'Para lojas que estão começando a organizar a operação.',
    featured: false,
    cta: 'Começar grátis',
    features: [
      'Até 4 usuários',
      'Até 30 veículos no estoque',
      'CRM e kanban de leads',
      'Vitrine pública com SEO',
      'Controle financeiro básico',
      'Suporte por e-mail',
    ],
  },
  {
    name: 'Pro',
    desc: 'Para lojas que querem crescer e vender mais com estrutura.',
    featured: true,
    cta: 'Começar grátis',
    features: [
      'Até 8 usuários',
      'Até 60 veículos no estoque',
      'CRM completo + kanban avançado',
      'Analytics e relatórios',
      'WhatsApp integrado',
      'IA para classificação de leads',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Enterprise',
    desc: 'Para grandes operações com múltiplas filiais e equipes.',
    featured: false,
    cta: 'Solicitar proposta',
    features: [
      'Usuários ilimitados',
      'Veículos ilimitados',
      'Todas as funcionalidades Pro',
      'API e integrações externas',
      'White-label (marca própria)',
      'Gerente de sucesso dedicado',
      'SLA e suporte 24h',
    ],
  },
]
