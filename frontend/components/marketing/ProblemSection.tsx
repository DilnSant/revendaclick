export default function ProblemSection() {
  return (
    <section className="bg-white py-24" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            O Problema
          </p>
          <h2
            id="problem-heading"
            className="font-heading text-3xl font-bold text-graphite sm:text-4xl"
          >
            Sua loja está perdendo vendas todos os dias.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            A maioria das revendas de veículos enfrenta os mesmos obstáculos que
            travam o crescimento. Você se identifica?
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p) => (
            <article
              key={p.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
            >
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary/60 to-transparent rounded-t-2xl" aria-hidden />
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                </svg>
              </div>
              <h3 className="font-heading text-base font-bold text-graphite">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{p.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const PROBLEMS = [
  {
    title: 'Dependência de marketplaces',
    desc: 'Pagar comissão alta por cada lead sem ter controle sobre o processo de vendas ou os dados dos seus clientes.',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    title: 'Pouca visibilidade online',
    desc: 'Seus veículos não aparecem no Google e você depende de indicações ou de pagar caro por anúncios.',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  },
  {
    title: 'Leads desqualificados',
    desc: 'Receber contatos de pessoas sem intenção real de compra, desperdiçando tempo valioso da sua equipe.',
    icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Atendimento descentralizado',
    desc: 'Mensagens chegando por WhatsApp pessoal, Instagram, e-mail e telefone — sem controle e sem histórico.',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    title: 'Falta de acompanhamento',
    desc: 'Não saber em que etapa está cada negociação e perder vendas por falta de follow-up no momento certo.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    title: 'Sem controle financeiro',
    desc: 'Não saber exatamente quanto sua loja lucra, quais comissões pagar e qual vendedor traz mais resultado.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]
