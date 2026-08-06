import ConversionLink from '@/components/marketing/ConversionLink'
import { Section, SectionHead, Reveal, IconArrow } from './ui'

const PASSOS = [
  {
    n: '01',
    titulo: 'Cadastre sua loja',
    texto: 'Nome, contato e identidade visual. Leva poucos minutos e não exige nada técnico.',
  },
  {
    n: '02',
    titulo: 'Suba seu estoque',
    texto:
      'Cadastre os veículos com dados FIPE e fotos. Sua vitrine pública já sobe no ar junto.',
  },
  {
    n: '03',
    titulo: 'Receba seus leads',
    texto:
      'Todo interessado cai no funil com dono e histórico. Nada mais some no meio das conversas.',
  },
  {
    n: '04',
    titulo: 'Venda mais',
    texto:
      'Acompanhe negociação, feche o negócio e veja comissão e margem calculadas em cima dele.',
  },
]

export default function HowItWorks() {
  return (
    <Section id="como-funciona">
      <Reveal>
        <SectionHead
          eyebrow="Começar é simples"
          title="Sua loja rodando hoje mesmo"
          lead="Sem instalação, sem consultor, sem projeto de implantação de três meses."
        />
      </Reveal>

      <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PASSOS.map((p, i) => (
          <Reveal key={p.n} delay={i * 90}>
            <li className="group relative h-full list-none rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 transition-all duration-300 hover:border-primary/25 hover:bg-white/[0.055]">
              <span className="font-heading text-5xl font-bold text-white/[0.08] transition-colors duration-300 group-hover:text-primary/25">
                {p.n}
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-white">{p.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{p.texto}</p>
              {i < PASSOS.length - 1 && (
                <IconArrow
                  className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-white/15 lg:block"
                  aria-hidden="true"
                />
              )}
            </li>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={300}>
        <div className="mt-12 flex justify-center">
          <ConversionLink
            href="/register"
            variant="signup"
            label="como-funciona"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-white shadow-brand transition-all duration-200 hover:scale-[1.02] hover:bg-primary-dark"
          >
            COMEÇAR TESTE GRATUITO
            <IconArrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </ConversionLink>
        </div>
      </Reveal>
    </Section>
  )
}
