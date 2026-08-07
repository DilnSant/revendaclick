import type { Metadata } from 'next'

import PixelScripts   from '@/components/marketing/PixelScripts'
import FloatingWhatsApp from '@/components/marketing/FloatingWhatsApp'

import LandingNav     from '@/components/landing/LandingNav'
import Hero           from '@/components/landing/Hero'
import LossSection    from '@/components/landing/LossSection'
import Consequence    from '@/components/landing/Consequence'
import BeforeAfter    from '@/components/landing/BeforeAfter'
import FeatureGrid    from '@/components/landing/FeatureGrid'
import Benefits       from '@/components/landing/Benefits'
import LossCalculator from '@/components/landing/LossCalculator'
import HowItWorks     from '@/components/landing/HowItWorks'
import Testimonials   from '@/components/landing/Testimonials'
import Metrics        from '@/components/landing/Metrics'
import Comparison     from '@/components/landing/Comparison'
import AISection      from '@/components/landing/AISection'
import Faq, { FAQ_ITENS } from '@/components/landing/Faq'
import FinalCta       from '@/components/landing/FinalCta'
import LandingFooter  from '@/components/landing/LandingFooter'
import { SITE_URL }   from '@/lib/site'

const SITE = SITE_URL

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'RevendaClick | Sistema completo para revendas de veículos',
  description:
    'Pare de perder vendas por falta de organização. CRM, estoque, site da loja, financeiro e comissões em uma única plataforma. 30 dias grátis, sem cartão.',
  keywords: [
    'sistema para revenda de veículos',
    'software para loja de carros',
    'CRM automotivo',
    'ERP automotivo',
    'gestão de estoque de veículos',
    'sistema para multimarcas',
    'controle de comissões vendedores veículos',
    'site para revenda de carros',
    'gestão de leads automotivo',
  ],
  authors: [{ name: 'RevendaClick' }],
  openGraph: {
    title: 'RevendaClick | Sistema completo para revendas de veículos',
    description:
      'CRM, estoque, site da loja, financeiro e comissões em uma única plataforma. 30 dias grátis, sem cartão de crédito.',
    url: SITE,
    siteName: 'RevendaClick',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RevendaClick — plataforma de gestão para revendas de veículos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RevendaClick | Sistema completo para revendas de veículos',
    description:
      'Pare de perder vendas por falta de organização. 30 dias grátis, sem cartão de crédito.',
    images: ['/og-image.png'],
    site: '@revendaclick',
  },
  alternates: { canonical: SITE },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

/**
 * JSON-LD. O FAQPage é gerado a partir de FAQ_ITENS — fonte única, para o
 * dado estruturado nunca divergir do que o visitante lê na página.
 */
const SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'RevendaClick',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` },
      description:
        'Plataforma de gestão e vendas para revendas de veículos: CRM, estoque, site da loja, financeiro e comissões.',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'RevendaClick',
      inLanguage: 'pt-BR',
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RevendaClick',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'pt-BR',
      description:
        'Plataforma para revendas de veículos: CRM e funil de vendas, gestão de estoque, vitrine pública, controle financeiro, comissões e indicadores.',
      url: SITE,
      publisher: { '@id': `${SITE}/#organization` },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'BRL',
        offerCount: 3,
        offers: [
          { '@type': 'Offer', name: 'Starter', category: 'Assinatura mensal' },
          { '@type': 'Offer', name: 'Pro', category: 'Assinatura mensal' },
          { '@type': 'Offer', name: 'Premium', category: 'Assinatura mensal' },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITENS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      {/* Marca o documento antes da primeira pintura. Sem isso, .reveal
          permanece visível — a landing nunca depende de JS para ser lida. */}
      <script
        dangerouslySetInnerHTML={{
          __html: "document.documentElement.classList.add('js-reveal')",
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
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
          {/* 1 — Promessa e CTA acima da dobra */}
          <Hero />

          {/* 2 — Dor: o custo invisível de não ter processo */}
          <LossSection />

          {/* 3 — Consequência: o concorrente responde primeiro */}
          <Consequence />

          {/* 4 — Contraste antes × depois */}
          <BeforeAfter />

          {/* 5 — Recursos reais da plataforma */}
          <FeatureGrid />

          {/* 6 — Benefícios em linguagem de ganho, não de função */}
          <Benefits />

          {/* 7 — Calculadora: transforma a dor em número */}
          <LossCalculator />

          {/* 8 — Como começar, em 4 passos */}
          <HowItWorks />

          {/* 9 — Prova social  ⚠️ CONTEÚDO FICTÍCIO (ver comentário no componente) */}
          <Testimonials />

          {/* 10 — Indicadores  ⚠️ NÚMEROS FICTÍCIOS (ver comentário no componente) */}
          <Metrics />

          {/* 11 — Comparativo com o método tradicional */}
          <Comparison />

          {/* 12 — Diferencial de IA */}
          <AISection />

          {/* 13 — Objeções */}
          <Faq />

          {/* 14 — Fechamento */}
          <FinalCta />
        </main>

        <LandingFooter />

        <FloatingWhatsApp />
      </div>
    </>
  )
}
