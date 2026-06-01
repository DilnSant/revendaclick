'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import LeadCaptureForm from './LeadCaptureForm'
import ConversionLink from './ConversionLink'
import { trackWhatsApp } from '@/lib/marketing/events'

const VideoModal = dynamic(() => import('./VideoModal'), { ssr: false })

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? '5511999999999'
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Ol%C3%A1!%20Quero%20conhecer%20o%20RevendaClick.`

export default function HeroSection() {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <>
      <section
        className="relative overflow-hidden bg-graphite pb-24 pt-16 md:pb-32 md:pt-24"
        aria-label="Apresentação do RevendaClick"
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
          <div className="absolute -top-20 right-1/3 h-[500px] w-[500px] animate-pulse rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 animate-pulse rounded-full bg-primary/10 blur-3xl animation-delay-2000" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
            {/* ── Left: Content ─────────────────────────────────────── */}
            <div className="animate-fade-in-up">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary-light">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
                Plataforma para lojas de veículos
              </div>

              <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                Transforme vídeos dos seus{' '}
                <span className="text-primary">veículos</span> em oportunidades
                reais de venda.
              </h1>

              <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-400">
                Centralize seu estoque, divulgue seus veículos, gere mais
                contatos e aumente suas vendas com uma plataforma criada para
                lojistas.
              </p>

              {/* ── Lead form ─────────────────────────────────────── */}
              <div className="mt-8">
                <LeadCaptureForm />
              </div>

              {/* Trust micro-copy */}
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Garantias">
                {TRUST.map((t) => (
                  <li key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>

              {/* Secondary CTA */}
              <div className="mt-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" aria-hidden />
                <span className="text-xs text-gray-500">ou</span>
                <div className="h-px flex-1 bg-white/10" aria-hidden />
              </div>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackWhatsApp}
                aria-label="Falar diretamente com a equipe pelo WhatsApp"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-400 transition-colors hover:text-green-300"
              >
                <WhatsAppIcon />
                Falar diretamente no WhatsApp
              </a>
            </div>

            {/* ── Right: Mockup + Video ─────────────────────────────── */}
            <div className="animate-fade-in-up animation-delay-300 hidden lg:block">
              <div className="relative">
                {/* Floating badges */}
                <div className="absolute -right-4 -top-5 z-10 flex animate-float items-center gap-2 rounded-full border border-green-500/30 bg-graphite-700/90 px-4 py-2 shadow-xl backdrop-blur">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" aria-hidden />
                  <span className="text-xs font-semibold text-green-400">+12 leads hoje</span>
                </div>
                <div className="absolute -bottom-5 -left-4 z-10 flex animate-float items-center gap-2 rounded-full border border-blue-500/30 bg-graphite-700/90 px-4 py-2 shadow-xl backdrop-blur animation-delay-2000">
                  <span className="text-xs font-semibold text-blue-400">📈 R$380k em estoque</span>
                </div>
                <div className="absolute -right-6 bottom-24 z-10 flex animate-float items-center gap-2 rounded-full border border-white/10 bg-graphite-700/90 px-3 py-1.5 shadow-xl backdrop-blur animation-delay-1000">
                  <span className="text-[11px] font-semibold text-gray-300">💬 3 contatos novos</span>
                </div>

                {/* Browser frame */}
                <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
                  {/* Chrome bar */}
                  <div className="flex items-center gap-3 border-b border-white/10 bg-graphite-700 px-4 py-3">
                    <div className="flex gap-1.5" aria-hidden>
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                      <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 rounded-md bg-white/10 px-3 py-1.5 text-[10px] text-gray-400">
                      app.revendaclick.com.br/dashboard
                    </div>
                  </div>

                  {/* Dashboard */}
                  <div className="flex h-72 bg-gray-50" role="img" aria-label="Preview do dashboard RevendaClick">
                    {/* Sidebar */}
                    <div className="flex w-12 flex-col items-center gap-3 border-r border-gray-200 bg-graphite py-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      {SIDEBAR_ICONS.map((path, i) => (
                        <div key={i} className="flex h-8 w-8 items-center justify-center rounded-lg">
                          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                          </svg>
                        </div>
                      ))}
                    </div>

                    {/* Main */}
                    <div className="flex-1 overflow-hidden p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400">Bom dia, Santos Car</p>
                          <p className="text-xs font-bold text-gray-800">Dashboard</p>
                        </div>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">SC</div>
                      </div>

                      <div className="mb-3 grid grid-cols-3 gap-2">
                        {KPIS.map((kpi) => (
                          <div key={kpi.label} className="rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
                            <p className="text-[9px] text-gray-400">{kpi.label}</p>
                            <p className={`text-sm font-bold ${kpi.color}`}>{kpi.value}</p>
                            <p className="text-[8px] text-gray-400">{kpi.sub}</p>
                          </div>
                        ))}
                      </div>

                      <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-gray-400">Veículos Recentes</p>
                      <div className="grid grid-cols-2 gap-2">
                        {VEHICLES.map((v) => (
                          <div key={v.name} className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
                            <div className="flex h-14 items-center justify-center bg-gray-100">
                              <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM7.3 7l1.4-3.6A1 1 0 019.6 3H17a1 1 0 01.9.6L19 7M3 11l1-4h16l1 4v4H3v-4z" />
                              </svg>
                            </div>
                            <div className="p-2">
                              <p className="text-[9px] font-semibold text-gray-800">{v.name}</p>
                              <p className="text-[9px] font-bold text-primary">{v.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video CTA */}
                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  aria-label="Ver demonstração em vídeo do RevendaClick"
                  className="group mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur transition-all hover:bg-white/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 transition-colors group-hover:bg-primary/30">
                    <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-300 group-hover:text-white">
                    Ver demonstração em vídeo
                  </span>
                  <span className="ml-auto text-xs text-gray-500">2 min</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile video CTA */}
          <div className="mt-8 lg:hidden">
            <button
              type="button"
              onClick={() => setVideoOpen(true)}
              aria-label="Ver demonstração em vídeo"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-300">Ver demonstração em vídeo</span>
            </button>
          </div>

          {/* Stats strip */}
          <div className="mt-16 hidden grid-cols-4 gap-8 border-t border-white/10 pt-10 md:grid">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-heading text-3xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {videoOpen && <VideoModal onClose={() => setVideoOpen(false)} />}
    </>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.554 4.112 1.522 5.843L.057 23.57a.5.5 0 00.61.637l5.917-1.516A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.942 9.942 0 01-5.13-1.427l-.368-.217-3.813.977.997-3.692-.239-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

const TRUST = ['30 dias grátis', 'Sem cartão de crédito', 'Cancele quando quiser', '+500 revendas']

const STATS = [
  { value: '+500',  label: 'Revendas cadastradas' },
  { value: '+30k',  label: 'Leads gerados' },
  { value: '98%',   label: 'Satisfação' },
  { value: '30d',   label: 'Grátis para testar' },
]

const KPIS = [
  { label: 'Estoque', value: '48',    sub: 'veículos',  color: 'text-graphite' },
  { label: 'Leads',   value: '127',   sub: 'este mês',  color: 'text-primary' },
  { label: 'Vendas',  value: 'R$380k', sub: 'período',  color: 'text-green-600' },
]

const VEHICLES = [
  { name: 'Corolla 2023', price: 'R$89.900' },
  { name: 'Civic 2022',   price: 'R$67.500' },
]

const SIDEBAR_ICONS = [
  'M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM7.3 7l1.4-3.6A1 1 0 019.6 3H17a1 1 0 01.9.6L19 7M3 11l1-4h16l1 4v4H3v-4z',
  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
]
