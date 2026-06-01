export default function SolutionSection() {
  return (
    <section className="bg-gray-50 py-24" id="recursos" aria-labelledby="solution-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            A Solução
          </p>
          <h2
            id="solution-heading"
            className="font-heading text-3xl font-bold text-graphite sm:text-4xl"
          >
            Uma plataforma criada para vender mais.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Do cadastro do veículo ao fechamento da venda — tudo em um único
            lugar, simples e eficiente.
          </p>
        </div>

        {/* Timeline desktop */}
        <div className="relative mt-20">
          {/* Connecting line */}
          <div
            className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent lg:block"
            aria-hidden
          />

          <ol className="grid gap-10 lg:grid-cols-5" aria-label="Passo a passo do RevendaClick">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative flex flex-col items-center text-center">
                {/* Number circle */}
                <div
                  className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-primary/20 bg-white shadow-card"
                  aria-hidden
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <svg
                      className="h-5 w-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                    </svg>
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-heading text-base font-bold text-graphite">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    title: 'Cadastre seus veículos',
    desc: 'Adicione fotos, vídeos, especificações técnicas, histórico e preço de venda com facilidade.',
    icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM7.3 7l1.4-3.6A1 1 0 019.6 3H17a1 1 0 01.9.6L19 7M3 11l1-4h16l1 4v4H3v-4z',
  },
  {
    title: 'Publique vídeos',
    desc: 'Mostre cada detalhe do seu estoque com vídeos que criam conexão e geram mais interesse nos compradores.',
    icon: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  },
  {
    title: 'Compartilhe em qualquer canal',
    desc: 'Divulgue no WhatsApp, Instagram, Facebook, TikTok e e-mail com um clique — sem copiar links manualmente.',
    icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
  },
  {
    title: 'Receba contatos qualificados',
    desc: 'Compradores interessados entram em contato direto. Sem intermediários, sem comissão perdida.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: 'Gerencie oportunidades',
    desc: 'Acompanhe cada negociação no CRM integrado e feche mais vendas com seu time totalmente alinhado.',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
]
