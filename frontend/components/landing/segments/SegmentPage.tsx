import type { Metadata } from 'next'

import PixelScripts     from '@/components/marketing/PixelScripts'
import FloatingWhatsApp from '@/components/marketing/FloatingWhatsApp'
import ConversionLink   from '@/components/marketing/ConversionLink'

import LandingNav     from '../LandingNav'
import LandingFooter  from '../LandingFooter'
import LossCalculator from '../LossCalculator'
import HowItWorks     from '../HowItWorks'
import Comparison     from '../Comparison'
import FeatureGrid    from '../FeatureGrid'
import { FAQ_ITENS }  from '../Faq'
import {
  Section, SectionHead, Card, Reveal, Glow,
  IconAlert, IconCheck, IconArrow,
} from '../ui'
import type { Segmento } from './data'

const SITE = 'https://revendaclick.com.br'
const GARANTIAS = ['30 dias grátis', 'Sem cartão de crédito', 'Cancele quando quiser']

/** Metadata + canonical por segmento. Cada página é indexável por conta própria. */
export function buildMetadata(s: Segmento): Metadata {
  const url = `${SITE}/${s.slug}`
  return {
    metadataBase: new URL(SITE),
    title: s.metaTitle,
    description: s.metaDescription,
    keywords: s.keywords,
    authors: [{ name: 'RevendaClick' }],
    openGraph: {
      title: s.metaTitle,
      description: s.metaDescription,
      url,
      siteName: 'RevendaClick',
      locale: 'pt_BR',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: s.metaTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: s.metaTitle,
      description: s.metaDescription,
      images: ['/og-image.png'],
      site: '@revendaclick',
    },
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  }
}

function schema(s: Segmento) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE}/${s.slug}#webpage`,
        url: `${SITE}/${s.slug}`,
        name: s.metaTitle,
        description: s.metaDescription,
        inLanguage: 'pt-BR',
        isPartOf: { '@id': `${SITE}/#website` },
        breadcrumb: { '@id': `${SITE}/${s.slug}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE}/${s.slug}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE },
          { '@type': 'ListItem', position: 2, name: s.eyebrow, item: `${SITE}/${s.slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        // Perguntas do segmento primeiro; as gerais completam.
        mainEntity: [...s.faq, ...FAQ_ITENS].map((i) => ({
          '@type': 'Question',
          name: i.q,
          acceptedAnswer: { '@type': 'Answer', text: i.a },
        })),
      },
    ],
  }
}

export default function SegmentPage({ segmento: s }: { segmento: Segmento }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.classList.add('js-reveal')",
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema(s)) }}
      />

      <PixelScripts />

      <div className="min-h-screen bg-[#07080B] text-white selection:bg-primary/30">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-graphite"
        >
          Pular para o conteúdo
        </a>

        <LandingNav />

        <main id="conteudo">
          {/* Hero do segmento */}
          <section className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
            <Glow className="-top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 bg-primary/20" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.035) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, #000 55%, transparent 100%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 70% 55% at 50% 0%, #000 55%, transparent 100%)',
              }}
            />

            <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center text-center">
              <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                {s.eyebrow}
              </span>

              <h1 className="animate-fade-in-up animation-delay-100 mt-7 font-heading text-4xl font-bold leading-[1.07] tracking-[-0.03em] text-white sm:text-6xl">
                {s.h1a}{' '}
                <span className="bg-gradient-to-r from-primary via-[#FF6B66] to-primary bg-clip-text text-transparent">
                  {s.h1b}
                </span>
              </h1>

              <p className="animate-fade-in-up animation-delay-200 mt-7 max-w-2xl text-lg leading-relaxed text-white/65">
                {s.sub}
              </p>

              <div className="animate-fade-in-up animation-delay-300 mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <ConversionLink
                  href="/register"
                  variant="signup"
                  label={`${s.slug}-hero`}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-white shadow-brand transition-all duration-200 hover:scale-[1.02] hover:bg-primary-dark sm:w-auto"
                >
                  COMEÇAR TESTE GRATUITO
                  <IconArrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </ConversionLink>
                <a
                  href="#calculadora"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.03] px-7 py-4 text-base font-medium text-white/85 transition-colors hover:bg-white/[0.07] sm:w-auto"
                >
                  Quanto estou perdendo?
                </a>
              </div>

              <ul className="animate-fade-in-up animation-delay-400 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {GARANTIAS.map((g) => (
                  <li key={g} className="flex items-center gap-1.5 text-sm text-white/50">
                    <IconCheck className="h-4 w-4 text-primary" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Dores do segmento */}
          <Section className="overflow-hidden">
            <Glow className="-left-40 top-20 h-[380px] w-[380px] bg-primary/10" />
            <Reveal>
              <SectionHead
                eyebrow="Soa familiar?"
                title="O que trava uma operação como a sua"
              />
            </Reveal>
            <div className="mt-14 grid gap-4 sm:grid-cols-2">
              {s.dores.map((d, i) => (
                <Reveal key={d.titulo} delay={i * 70}>
                  <Card className="group h-full">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <IconAlert className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-heading text-lg font-semibold text-white">
                      {d.titulo}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{d.texto}</p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </Section>

          {/* Ganhos do segmento */}
          <Section>
            <Reveal>
              <SectionHead eyebrow="O que muda" title="Como o RevendaClick resolve" />
            </Reveal>
            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2">
              {s.ganhos.map((g, i) => (
                <Reveal key={g.titulo} delay={i * 70}>
                  <div className="h-full bg-[#07080B] p-7 transition-colors duration-300 hover:bg-white/[0.03]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <IconCheck className="h-4 w-4" />
                    </div>
                    <h3 className="mt-4 font-heading text-xl font-semibold text-white">
                      {g.titulo}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-white/55">{g.texto}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Section>

          {/* Seções compartilhadas com a landing principal */}
          <LossCalculator />
          <FeatureGrid />
          <Comparison />
          <HowItWorks />

          {/* FAQ: perguntas do segmento + gerais */}
          <Section id="faq">
            <Reveal>
              <SectionHead eyebrow="Dúvidas" title="O que perguntam antes de começar" />
            </Reveal>
            <div className="mx-auto mt-14 max-w-3xl divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {[...s.faq, ...FAQ_ITENS].map((item, i) => (
                <Reveal key={item.q} delay={i * 40}>
                  <details className="group">
                    <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                      <span className="font-heading text-base font-semibold text-white/90 sm:text-lg">
                        {item.q}
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.12] text-white/50 transition-all duration-300 group-open:rotate-45 group-open:border-primary/40 group-open:text-primary"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                    </summary>
                    <p className="pb-6 pr-14 text-sm leading-relaxed text-white/55">{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </Section>

          {/* CTA final do segmento */}
          <section aria-label="Comece agora" className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.16] blur-[140px]"
            />
            <Reveal>
              <div className="relative mx-auto w-full max-w-3xl text-center">
                <h2 className="font-heading text-3xl font-bold leading-[1.1] tracking-[-0.025em] text-white sm:text-5xl">
                  {s.ctaTitulo}
                </h2>
                <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/65">
                  {s.ctaSub}
                </p>
                <div className="mt-11 flex justify-center">
                  <ConversionLink
                    href="/register"
                    variant="signup"
                    label={`${s.slug}-cta-final`}
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
        </main>

        <LandingFooter />
        <FloatingWhatsApp />
      </div>
    </>
  )
}
