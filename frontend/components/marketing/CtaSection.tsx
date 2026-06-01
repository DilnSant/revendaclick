import ConversionLink from './ConversionLink'

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? '5511999999999'
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Ol%C3%A1!%20Quero%20conhecer%20o%20RevendaClick.`

export default function CtaSection() {
  return (
    <section
      className="relative overflow-hidden bg-graphite py-28"
      aria-labelledby="cta-heading"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute left-1/4 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary-light">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
          30 dias grátis — sem cartão de crédito
        </div>

        <h2
          id="cta-heading"
          className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
        >
          Pronto para vender mais veículos?
        </h2>

        <p className="mt-6 text-lg leading-relaxed text-gray-400">
          Veja como o RevendaClick pode transformar a presença digital da sua
          loja — do estoque à vitrine, do lead ao fechamento.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <ConversionLink
            href="/register"
            variant="demo"
            className="btn-primary-lg w-full sm:w-auto"
          >
            Solicitar Demonstração
          </ConversionLink>

          <ConversionLink
            href={WA_LINK}
            variant="whatsapp"
            external
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            <WhatsAppIcon />
            Falar no WhatsApp
          </ConversionLink>
        </div>

        {/* Trust bar */}
        <ul className="mt-12 flex flex-wrap justify-center gap-8 border-t border-white/10 pt-8" aria-label="Garantias">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm text-gray-400">
              <svg
                className="h-4 w-4 shrink-0 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.554 4.112 1.522 5.843L.057 23.57a.5.5 0 00.61.637l5.917-1.516A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.942 9.942 0 01-5.13-1.427l-.368-.217-3.813.977.997-3.692-.239-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

const TRUST = [
  '30 dias grátis',
  'Sem cartão de crédito',
  'Cancele quando quiser',
  'Suporte incluído',
]
