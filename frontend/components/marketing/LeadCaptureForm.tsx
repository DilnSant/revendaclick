'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { trackLead } from '@/lib/marketing/events'

function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

const VEHICLE_OPTIONS = [
  { value: '',      label: 'Qtd. de veículos no estoque' },
  { value: '1-10',  label: '1 a 10 veículos' },
  { value: '11-30', label: '11 a 30 veículos' },
  { value: '31-60', label: '31 a 60 veículos' },
  { value: '60+',   label: 'Mais de 60 veículos' },
]

const STATES = [
  '', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ',
  'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export default function LeadCaptureForm() {
  const router = useRouter()
  const [name, setName]                   = useState('')
  const [phone, setPhone]                 = useState('')
  const [vehiclesCount, setVehiclesCount] = useState('')
  const [city, setCity]                   = useState('')
  const [state, setState]                 = useState('')
  const [consent, setConsent]             = useState(false)
  const [honeypot, setHoneypot]           = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const utmRef = useRef<Record<string, string>>({})

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    utmRef.current = {
      source:       p.get('utm_source') || (document.referrer ? 'referral' : 'organic'),
      utm_source:   p.get('utm_source')   ?? '',
      utm_medium:   p.get('utm_medium')   ?? '',
      utm_campaign: p.get('utm_campaign') ?? '',
      utm_content:  p.get('utm_content')  ?? '',
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (honeypot) return

    const digits = phone.replace(/\D/g, '')
    if (!name.trim() || digits.length < 10) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/leads/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           name.trim(),
          phone:          digits,
          vehicles_count: vehiclesCount || undefined,
          city:           city.trim()   || undefined,
          state:          state         || undefined,
          website:        honeypot,
          ...utmRef.current,
        }),
      })

      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}))
        setError(data.error ?? 'Erro ao enviar. Tente novamente.')
        return
      }

      // Conversion event fires only after confirmed 201
      trackLead()
      router.push('/obrigado')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isValid = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10 && consent

  const inputCls =
    'w-full rounded-xl bg-white/15 px-4 py-3.5 text-sm font-medium text-white ' +
    'placeholder-white/40 outline-none ring-inset transition ' +
    'focus:bg-white/20 focus:ring-2 focus:ring-primary/60'

  const selectCls = `${inputCls} appearance-none cursor-pointer`

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Formulário de solicitação de demonstração"
    >
      {/* Honeypot — invisible to humans */}
      <div className="absolute opacity-0 pointer-events-none" aria-hidden tabIndex={-1}>
        <input
          type="text"
          name="website"
          autoComplete="off"
          tabIndex={-1}
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm">
        <div className="grid grid-cols-6 gap-3">
          {/* Name */}
          <div className="col-span-6 sm:col-span-3">
            <input
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              autoComplete="name"
              aria-label="Nome completo"
              className={inputCls}
            />
          </div>

          {/* Phone */}
          <div className="col-span-6 sm:col-span-3">
            <input
              type="tel"
              placeholder="(XX) XXXXX-XXXX"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              required
              maxLength={15}
              autoComplete="tel"
              inputMode="numeric"
              aria-label="Telefone com DDD"
              className={inputCls}
            />
          </div>

          {/* Vehicles count */}
          <div className="relative col-span-6 sm:col-span-2">
            <select
              value={vehiclesCount}
              onChange={(e) => setVehiclesCount(e.target.value)}
              aria-label="Quantidade de veículos no estoque"
              className={selectCls}
            >
              {VEHICLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>

          {/* City */}
          <div className="col-span-4 sm:col-span-3">
            <input
              type="text"
              placeholder="Sua cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={100}
              autoComplete="address-level2"
              aria-label="Cidade"
              className={inputCls}
            />
          </div>

          {/* State */}
          <div className="relative col-span-2 sm:col-span-1">
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              aria-label="Estado (UF)"
              className={selectCls}
            >
              {STATES.map((uf) => (
                <option key={uf} value={uf} disabled={uf === ''}>
                  {uf === '' ? 'UF' : uf}
                </option>
              ))}
            </select>
            <ChevronDown />
          </div>

          {/* LGPD consent */}
          <div className="col-span-6 flex items-start gap-3">
            <input
              type="checkbox"
              id="lgpd-consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="h-4 w-4 rounded border border-white/30 bg-transparent accent-primary cursor-pointer mt-0.5 shrink-0"
              aria-required="true"
            />
            <label htmlFor="lgpd-consent" className="text-xs leading-relaxed text-gray-400 cursor-pointer">
              Li e concordo com a{' '}
              <a
                href="/privacidade"
                className="underline hover:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary rounded"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política de Privacidade
              </a>{' '}
              e autorizo contato comercial.
            </label>
          </div>

          {/* Submit */}
          <div className="col-span-6">
            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-brand transition-all hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Enviando…
                </span>
              ) : (
                'Solicitar Demonstração Gratuita →'
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" aria-live="assertive" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}

    </form>
  )
}

function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
