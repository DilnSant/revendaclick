export default function TestimonialsSection() {
  return (
    <section className="bg-white py-24" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Depoimentos
          </p>
          <h2
            id="testimonials-heading"
            className="font-heading text-3xl font-bold text-graphite sm:text-4xl"
          >
            O que dizem os nossos clientes.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Revendas reais que usam o RevendaClick para vender mais todos os dias.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-0.5" aria-label={`Avaliação: ${t.rating} de 5 estrelas`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${i < t.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="flex-1">
                <p className="text-sm leading-relaxed text-gray-600">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </blockquote>

              {/* Author */}
              <footer className="mt-5 flex items-center gap-3 border-t border-gray-50 pt-5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: t.avatarColor }}
                  aria-hidden
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-graphite">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role} · {t.company}</p>
                  <p className="text-xs text-gray-400">{t.city}</p>
                </div>
              </footer>
            </article>
          ))}
        </div>

        {/* Trust badge */}
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-gray-400">
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Depoimentos de clientes reais. Aguardando autorização para publicação das fotos e nomes completos.
        </div>
      </div>
    </section>
  )
}

const TESTIMONIALS = [
  {
    name: 'João S.',
    initials: 'JS',
    role: 'Proprietário',
    company: 'Auto Silva Veículos',
    city: 'São Paulo, SP',
    rating: 5,
    avatarColor: '#E53935',
    quote:
      'Antes do RevendaClick, eu perdia leads no WhatsApp pessoal e não sabia onde estavam as oportunidades. Hoje tenho tudo organizado, minha equipe vende mais e eu durmo tranquilo sabendo que nenhum contato se perde.',
  },
  {
    name: 'Maria C.',
    initials: 'MC',
    role: 'Gerente Comercial',
    company: 'Santos Multimarcas',
    city: 'Belo Horizonte, MG',
    rating: 5,
    avatarColor: '#1C1C1E',
    quote:
      'A vitrine pública no Google foi um divisor de águas. Clientes me encontram organicamente e chegam muito mais qualificados. O custo por lead caiu mais de 60% desde que saí dos marketplaces caros.',
  },
  {
    name: 'Carlos O.',
    initials: 'CO',
    role: 'Sócio',
    company: 'Moto & Car Premium',
    city: 'Curitiba, PR',
    rating: 5,
    avatarColor: '#1565C0',
    quote:
      'Configurei em menos de 30 minutos. Em uma semana já tinha recebido mais de 20 leads qualificados pelo WhatsApp e pelo Google. O suporte é excelente — responderam rápido e me ajudaram com tudo.',
  },
]
