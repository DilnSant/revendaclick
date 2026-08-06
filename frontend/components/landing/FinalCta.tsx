import ConversionLink from '@/components/marketing/ConversionLink'
import { Reveal, IconArrow, IconCheck } from './ui'

const GARANTIAS = ['30 dias grátis', 'Sem cartão de crédito', 'Cancele quando quiser']

export default function FinalCta() {
  return (
    <section aria-label="Comece agora" className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.17] blur-[140px]"
      />

      <Reveal>
        <div className="relative mx-auto w-full max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold leading-[1.1] tracking-[-0.025em] text-white sm:text-5xl lg:text-[3.4rem]">
            Sua próxima venda pode estar esperando
            <br className="hidden sm:block" />{' '}
            <span className="text-primary">apenas uma resposta mais rápida.</span>
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/65">
            Centralize toda a operação da sua revenda e pare de descobrir tarde demais que o
            cliente já comprou em outro lugar.
          </p>

          <div className="mt-11 flex justify-center">
            <ConversionLink
              href="/register"
              variant="signup"
              label="cta-final"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-9 py-5 text-base font-semibold text-white shadow-brand transition-all duration-200 hover:scale-[1.02] hover:bg-primary-dark sm:w-auto sm:text-lg"
            >
              COMEÇAR TESTE GRATUITO
              <IconArrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </ConversionLink>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {GARANTIAS.map((g) => (
              <li key={g} className="flex items-center gap-1.5 text-sm text-white/50">
                <IconCheck className="h-4 w-4 text-primary" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}
