import type { Metadata } from 'next'
import NavBar              from '@/components/marketing/NavBar'
import HeroSection         from '@/components/marketing/HeroSection'
import SocialProofSection  from '@/components/marketing/SocialProofSection'
import ProblemSection      from '@/components/marketing/ProblemSection'
import SolutionSection     from '@/components/marketing/SolutionSection'
import BenefitsSection     from '@/components/marketing/BenefitsSection'
import WhySection          from '@/components/marketing/WhySection'
import HowItWorksSection   from '@/components/marketing/HowItWorksSection'
import TestimonialsSection from '@/components/marketing/TestimonialsSection'
import ScreenshotsSection  from '@/components/marketing/ScreenshotsSection'
import PricingSection      from '@/components/marketing/PricingSection'
import FaqSection          from '@/components/marketing/FaqSection'
import CtaSection          from '@/components/marketing/CtaSection'
import FooterSection       from '@/components/marketing/FooterSection'
import FloatingWhatsApp    from '@/components/marketing/FloatingWhatsApp'
import PixelScripts        from '@/components/marketing/PixelScripts'

export const metadata: Metadata = {
  title: 'RevendaClick | Plataforma para Lojas de Veículos',
  description:
    'Transforme vídeos dos seus veículos em oportunidades reais de venda. Centralize estoque, divulgue mais e venda mais com o RevendaClick.',
  keywords: [
    'plataforma para revenda de veículos',
    'sistema para loja de carros',
    'CRM automotivo',
    'gestão de estoque veículos',
    'leads para revenda de carros',
    'software para concessionária',
    'divulgação de veículos online',
    'vendas de carros online',
    'revenda de veículos digital',
  ],
  authors: [{ name: 'RevendaClick' }],
  openGraph: {
    title: 'RevendaClick | Plataforma para Lojas de Veículos',
    description:
      'Transforme vídeos dos seus veículos em oportunidades reais de venda. Centralize estoque, divulgue mais e venda mais.',
    url: 'https://revendaclick.com.br',
    siteName: 'RevendaClick',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://revendaclick.com.br/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RevendaClick — Plataforma para Lojas de Veículos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RevendaClick | Plataforma para Lojas de Veículos',
    description: 'Transforme vídeos dos seus veículos em oportunidades reais de venda.',
    images: ['https://revendaclick.com.br/og-image.png'],
    site: '@revendaclick',
  },
  alternates: {
    canonical: 'https://revendaclick.com.br',
  },
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

const SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://revendaclick.com.br/#organization',
      name: 'RevendaClick',
      url: 'https://revendaclick.com.br',
      logo: { '@type': 'ImageObject', url: 'https://revendaclick.com.br/logo.png' },
      description: 'Plataforma SaaS para lojas de veículos. Centralize estoque, gere leads e venda mais.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://revendaclick.com.br/#website',
      url: 'https://revendaclick.com.br',
      name: 'RevendaClick',
      publisher: { '@id': 'https://revendaclick.com.br/#organization' },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RevendaClick',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'Plataforma SaaS multi-tenant para revendas de veículos. CRM, estoque, leads, financeiro e WhatsApp.',
      url: 'https://revendaclick.com.br',
      publisher: { '@id': 'https://revendaclick.com.br/#organization' },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'BRL',
        offerCount: 3,
        offers: [
          { '@type': 'Offer', name: 'Starter' },
          { '@type': 'Offer', name: 'Pro' },
          { '@type': 'Offer', name: 'Enterprise' },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'O RevendaClick funciona para qualquer loja?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim! O RevendaClick foi desenvolvido para revendas de veículos de qualquer porte — desde lojas com 10 veículos até grandes revendedoras com centenas de itens no estoque. O sistema se adapta ao tamanho e às necessidades da sua operação.',
          },
        },
        {
          '@type': 'Question',
          name: 'Preciso instalar algo?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Não! O RevendaClick funciona 100% na web. Basta acessar pelo computador, celular ou tablet — qualquer navegador moderno funciona. Nenhuma instalação, nenhum servidor próprio, nenhuma configuração técnica necessária.',
          },
        },
        {
          '@type': 'Question',
          name: 'Posso divulgar em redes sociais?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim! Você pode compartilhar seus veículos diretamente no Instagram, Facebook, TikTok e qualquer outra rede social com um clique. Cada veículo tem sua própria página pública com URL para divulgação em qualquer canal.',
          },
        },
        {
          '@type': 'Question',
          name: 'Consigo compartilhar pelo WhatsApp?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Com certeza! Cada veículo cadastrado tem um link individual que você pode copiar e enviar para qualquer contato pelo WhatsApp, Telegram ou qualquer aplicativo de mensagens. O link abre uma página elegante com todas as informações e fotos do veículo.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como funciona o suporte?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oferecemos suporte por e-mail e WhatsApp para todos os planos. Os planos Pro e Enterprise têm atendimento prioritário com tempo de resposta reduzido. O plano Enterprise inclui um gerente de sucesso dedicado para acompanhar sua operação.',
          },
        },
        {
          '@type': 'Question',
          name: 'Posso testar antes de assinar?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim! Todos os planos incluem 30 dias grátis, sem necessidade de cartão de crédito. Você configura sua loja, cadastra seus veículos e testa todas as funcionalidades sem nenhum compromisso. Só começa a pagar se decidir continuar.',
          },
        },
      ],
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
      />

      {/* Tracking pixels (Meta + TikTok) */}
      <PixelScripts />

      <div className="min-h-screen bg-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-graphite"
        >
          Pular para o conteúdo
        </a>

        <NavBar />

        <main id="main-content">
          {/* 1. Hero — formulário de captura de leads acima da dobra */}
          <HeroSection />

          {/* 2. Prova social — stats + canais de tráfego */}
          <SocialProofSection />

          {/* 3. Dores do lojista */}
          <ProblemSection />

          {/* 4. Solução em 5 passos */}
          <SolutionSection />

          {/* 5. Benefícios */}
          <BenefitsSection />

          {/* 6. Por que escolher o RevendaClick */}
          <WhySection />

          {/* 7. Como funciona */}
          <HowItWorksSection />

          {/* 8. Depoimentos */}
          <TestimonialsSection />

          {/* 9. Plataforma (screenshots) */}
          <ScreenshotsSection />

          {/* 10. Planos */}
          <PricingSection />

          {/* 11. FAQ */}
          <FaqSection />

          {/* 12. CTA final */}
          <CtaSection />
        </main>

        <FooterSection />

        {/* Floating WhatsApp CTA */}
        <FloatingWhatsApp />
      </div>
    </>
  )
}
