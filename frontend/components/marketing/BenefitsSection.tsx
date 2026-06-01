export default function BenefitsSection() {
  return (
    <section className="bg-white py-24" aria-labelledby="benefits-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Benefícios
          </p>
          <h2
            id="benefits-heading"
            className="font-heading text-3xl font-bold text-graphite sm:text-4xl"
          >
            Tudo que sua revenda precisa para crescer.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Uma plataforma que cobre cada ponto da operação — do estoque ao
            fechamento da venda.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <article
              key={b.title}
              className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: b.bg }}
                aria-hidden
              >
                <svg
                  className="h-6 w-6"
                  style={{ color: b.color }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-graphite">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{b.desc}</p>
              </div>
              <div className="mt-auto">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Saiba mais
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const BENEFITS = [
  {
    title: 'Mais visibilidade',
    desc: 'Apareça onde seus compradores estão — Google, redes sociais e marketplaces — com sua loja sempre ativa.',
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    bg: 'rgba(229,57,53,0.08)',
    color: '#E53935',
  },
  {
    title: 'Mais contatos',
    desc: 'Receba leads qualificados 24 horas por dia, mesmo quando sua loja está fechada. Nunca perca uma oportunidade.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    bg: 'rgba(59,130,246,0.08)',
    color: '#3B82F6',
  },
  {
    title: 'Mais oportunidades',
    desc: 'Converta mais visitantes em compradores reais com um processo comercial organizado e eficiente.',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    bg: 'rgba(16,185,129,0.08)',
    color: '#10B981',
  },
  {
    title: 'Mais organização',
    desc: 'Centralize estoque, leads, clientes e financeiro em uma única plataforma. Sem planilhas, sem caos.',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    bg: 'rgba(139,92,246,0.08)',
    color: '#8B5CF6',
  },
  {
    title: 'Mais produtividade',
    desc: 'Automatize tarefas repetitivas com IA e libere sua equipe de vendas para focar no que importa: vender.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    bg: 'rgba(245,158,11,0.08)',
    color: '#F59E0B',
  },
  {
    title: 'Mais vendas',
    desc: 'Vendedores mais produtivos, processo mais eficiente e mais negócios fechados com menos esforço.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    bg: 'rgba(16,185,129,0.08)',
    color: '#10B981',
  },
]
