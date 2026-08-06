import ConversionLink from '@/components/marketing/ConversionLink'
import { Glow, IconArrow, IconCheck } from './ui'

/** Garantias verificáveis — nada aqui é promessa que o produto não cumpre. */
const GARANTIAS = ['30 dias grátis', 'Sem cartão de crédito', 'Cancele quando quiser']

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40">
      <Glow className="-top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 bg-primary/20" />
      <Glow className="right-0 top-60 h-[380px] w-[380px] bg-indigo-500/10" />

      {/* Grade sutil de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
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
        <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Plataforma completa para revendas de veículos
        </span>

        <h1 className="animate-fade-in-up animation-delay-100 mt-7 font-heading text-4xl font-bold leading-[1.06] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
          Pare de perder vendas
          <br className="hidden sm:block" />{' '}
          <span className="bg-gradient-to-r from-primary via-[#FF6B66] to-primary bg-clip-text text-transparent">
            por falta de organização.
          </span>
        </h1>

        <p className="animate-fade-in-up animation-delay-200 mt-7 max-w-2xl text-lg leading-relaxed text-white/65 sm:text-xl">
          O RevendaClick centraliza atendimento, estoque, financeiro e vendas em uma única
          plataforma. Você para de caçar informação em planilhas e volta a vender.
        </p>

        <div className="animate-fade-in-up animation-delay-300 mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <ConversionLink
            href="/register"
            variant="signup"
            label="hero-primary"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-white shadow-brand transition-all duration-200 hover:scale-[1.02] hover:bg-primary-dark sm:w-auto"
          >
            COMEÇAR TESTE GRATUITO
            <IconArrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </ConversionLink>
          <a
            href="#calculadora"
            className="inline-flex w-full items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.03] px-7 py-4 text-base font-medium text-white/85 backdrop-blur-sm transition-colors hover:bg-white/[0.07] sm:w-auto"
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

      {/* Mock do produto — representação abstrata do dashboard, não screenshot falso */}
      <div className="animate-fade-in-up animation-delay-500 relative mx-auto mt-20 w-full max-w-5xl">
        <div className="rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-2 shadow-2xl backdrop-blur-sm">
          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0B0C11]">
            <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-3 text-xs text-white/35">app.revendaclick.com.br</span>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              {[
                { k: 'Leads hoje', v: '12', d: 'aguardando resposta' },
                { k: 'Em negociação', v: '31', d: 'no pipeline' },
                { k: 'Estoque ativo', v: '48', d: 'veículos publicados' },
              ].map((c) => (
                <div key={c.k} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <p className="text-xs text-white/45">{c.k}</p>
                  <p className="mt-1.5 font-heading text-3xl font-bold text-white">{c.v}</p>
                  <p className="mt-0.5 text-xs text-white/35">{c.d}</p>
                </div>
              ))}
              <div className="sm:col-span-3">
                <div className="flex h-32 items-end gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  {[38, 52, 44, 67, 58, 79, 71, 88, 76, 94, 85, 100].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary/25 to-primary/70"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-8 -bottom-6 h-24 bg-primary/15 blur-[80px]"
        />
      </div>
    </section>
  )
}
