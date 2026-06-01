export default function HowItWorksSection() {
  return (
    <section
      className="relative overflow-hidden bg-graphite py-24"
      id="como-funciona"
      aria-labelledby="how-heading"
    >
      {/* Background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Como funciona
          </p>
          <h2
            id="how-heading"
            className="font-heading text-3xl font-bold text-white sm:text-4xl"
          >
            Simples, rápido e eficiente.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-400">
            Em menos de 30 minutos sua loja está no ar, seus veículos publicados
            e você já pode receber contatos.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <article
              key={step.title}
              className="relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:bg-white/10"
            >
              {/* Step number */}
              <div className="mb-5" aria-hidden>
                <span className="font-heading text-5xl font-bold text-primary/20 leading-none select-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10" aria-hidden>
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

              <h3 className="font-heading text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{step.desc}</p>

              {/* Connector arrow (not last) */}
              {i < STEPS.length - 1 && (
                <div
                  className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 lg:block"
                  aria-hidden
                >
                  <svg
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    title: 'Cadastre',
    desc: 'Crie sua conta e configure sua loja com nome, logo, cores e informações da revenda em minutos.',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  },
  {
    title: 'Grave',
    desc: 'Cadastre seus veículos com fotos e vídeos de alta qualidade. Especificações técnicas e preço incluídos.',
    icon: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  },
  {
    title: 'Compartilhe',
    desc: 'Envie links individuais por WhatsApp, publique no Instagram e Facebook com um único clique.',
    icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
  },
  {
    title: 'Venda',
    desc: 'Gerencie todos os contatos no CRM integrado e acompanhe cada negociação até o fechamento.',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  },
]
