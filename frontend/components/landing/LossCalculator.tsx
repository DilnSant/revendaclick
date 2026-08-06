'use client'

import { useState, useMemo, useId } from 'react'
import ConversionLink from '@/components/marketing/ConversionLink'
import { IconArrow } from './ui'

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export default function LossCalculator() {
  const [leads, setLeads] = useState(10)
  const [ticket, setTicket] = useState(2500)
  const leadsId = useId()
  const ticketId = useId()

  const { mes, ano } = useMemo(
    () => ({ mes: leads * ticket, ano: leads * ticket * 12 }),
    [leads, ticket],
  )

  return (
    <section
      id="calculadora"
      aria-label="Calculadora de prejuízo"
      className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[460px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.14] blur-[130px]"
      />

      <div className="relative mx-auto w-full max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Faça a conta
          </span>
          <h2 className="mt-5 font-heading text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-5xl">
            Quanto você deixou na mesa <span className="text-primary">este ano?</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/60 sm:text-lg">
            Ajuste os números para a realidade da sua loja. A conta costuma incomodar.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-white/[0.1] bg-white/[0.035] p-6 backdrop-blur-sm sm:p-10">
          <div className="grid gap-9 sm:grid-cols-2">
            <div>
              <label htmlFor={leadsId} className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-white/70">
                  Leads perdidos por mês
                </span>
                <span className="font-heading text-2xl font-bold text-white">{leads}</span>
              </label>
              <input
                id={leadsId}
                type="range"
                min={1}
                max={50}
                step={1}
                value={leads}
                onChange={(e) => setLeads(Number(e.target.value))}
                className="range-brand mt-4 w-full"
                aria-describedby={`${leadsId}-hint`}
              />
              <p id={`${leadsId}-hint`} className="mt-2 text-xs text-white/35">
                Contatos que chegaram e não viraram atendimento
              </p>
            </div>

            <div>
              <label htmlFor={ticketId} className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-white/70">Lucro médio por venda</span>
                <span className="font-heading text-2xl font-bold text-white">
                  {BRL.format(ticket)}
                </span>
              </label>
              <input
                id={ticketId}
                type="range"
                min={500}
                max={15000}
                step={250}
                value={ticket}
                onChange={(e) => setTicket(Number(e.target.value))}
                className="range-brand mt-4 w-full"
                aria-describedby={`${ticketId}-hint`}
              />
              <p id={`${ticketId}-hint`} className="mt-2 text-xs text-white/35">
                Sua margem líquida em um veículo vendido
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 border-t border-white/[0.08] pt-9 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-white/40">Por mês</p>
              <p
                aria-live="polite"
                className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl"
              >
                {BRL.format(mes)}
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/[0.1] p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-primary/80">Por ano</p>
              <p
                aria-live="polite"
                className="mt-2 font-heading text-3xl font-bold text-white sm:text-4xl"
              >
                {BRL.format(ano)}
              </p>
            </div>
          </div>

          <p className="mt-7 text-center text-sm leading-relaxed text-white/55">
            É esse o valor que passa pela sua loja e vai embora — não por falta de cliente,
            mas por falta de acompanhamento.
          </p>

          <div className="mt-8 flex justify-center">
            <ConversionLink
              href="/register"
              variant="signup"
              label="calculadora"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-semibold text-white shadow-brand transition-all duration-200 hover:scale-[1.02] hover:bg-primary-dark"
            >
              QUERO PARAR DE PERDER
              <IconArrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </ConversionLink>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Simulação baseada nos valores que você informou. Serve como estimativa, não como
          promessa de resultado.
        </p>
      </div>
    </section>
  )
}
