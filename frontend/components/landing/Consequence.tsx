import { Section, Reveal, Glow } from './ui'

export default function Consequence() {
  return (
    <Section className="overflow-hidden py-16 sm:py-20">
      <Glow className="left-1/2 top-1/2 h-[320px] w-[700px] -translate-x-1/2 -translate-y-1/2 bg-primary/[0.13]" />

      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] px-6 py-14 text-center backdrop-blur-sm sm:px-14 sm:py-20">
          <p className="font-heading text-2xl font-semibold leading-snug text-white/50 sm:text-3xl">
            Enquanto você procura uma informação em planilhas...
          </p>
          <p className="mt-5 font-heading text-3xl font-bold leading-snug tracking-[-0.02em] text-white sm:text-[2.6rem]">
            seu concorrente já respondeu o cliente,
            <br className="hidden sm:block" /> mandou as fotos e{' '}
            <span className="text-primary">fechou o negócio.</span>
          </p>
          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/55">
            A diferença entre a venda e a perda quase nunca é preço. É quem respondeu primeiro,
            com a informação certa na mão.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
