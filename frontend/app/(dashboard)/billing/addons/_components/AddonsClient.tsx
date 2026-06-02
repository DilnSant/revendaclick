'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/billing-utils'

interface PlanAddon {
  addon_type: string
  display_name: string
  description: string
  price_monthly: number
  features: string[]
}

interface ActiveAddon {
  id: string
  addon_type: string
  display_name: string
  description: string
  price_monthly: number
  quantity: number
  status: string
  started_at: string
  features: string[]
  payment_link?: string
  is_redundant?: boolean
}

interface Props {
  available: PlanAddon[]
  active: ActiveAddon[]
}

const ADDON_ICONS: Record<string, React.ReactNode> = {
  whatsapp_automation: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  ia_recovery: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  user_extra: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
}

const ADDON_COLORS: Record<string, string> = {
  whatsapp_automation: 'bg-green-50 text-green-600 border-green-200',
  ia_recovery:         'bg-purple-50 text-purple-600 border-purple-200',
  user_extra:          'bg-blue-50 text-blue-600 border-blue-200',
}

export default function AddonsClient({ available, active }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({})

  const activeTypes = new Set(active.map((a) => a.addon_type))

  const pendingAddons = active.filter((a) => a.status === 'pending_payment')
  const runningAddons = active.filter((a) => a.status === 'active' || a.status === 'past_due')

  async function handleActivate(addonType: string) {
    setLoading(addonType)
    setMessages((m) => ({ ...m, [addonType]: undefined as never }))
    try {
      const res = await fetch(`/api/billing/addons-action/${addonType}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setMessages((m) => ({ ...m, [addonType]: { type: 'error', text: data.error ?? 'Erro ao ativar.' } }))
      } else {
        router.refresh()
        const payLink = data.data?.payment_link ?? ''
        setMessages((m) => ({
          ...m,
          [addonType]: {
            type: 'success',
            text: payLink
              ? 'Recurso solicitado! Clique em "Pagar agora" para liberar o acesso.'
              : 'Recurso solicitado! Link de pagamento enviado para o e-mail cadastrado.',
          },
        }))
      }
    } catch {
      setMessages((m) => ({ ...m, [addonType]: { type: 'error', text: 'Erro de conexão.' } }))
    } finally {
      setLoading(null)
    }
  }

  async function handleCancel(addonType: string) {
    if (!confirm('Deseja cancelar este recurso?')) return
    setLoading(addonType)
    setMessages((m) => ({ ...m, [addonType]: undefined as never }))
    try {
      const res = await fetch(`/api/billing/addons-action/${addonType}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setMessages((m) => ({ ...m, [addonType]: { type: 'error', text: data.error ?? 'Erro ao cancelar.' } }))
      } else {
        router.refresh()
        setMessages((m) => ({ ...m, [addonType]: { type: 'success', text: 'Recurso cancelado com sucesso.' } }))
      }
    } catch {
      setMessages((m) => ({ ...m, [addonType]: { type: 'error', text: 'Erro de conexão.' } }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">

      {/* ── Aguardando pagamento ────────────────────────────────────────────── */}
      {pendingAddons.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-amber-600 uppercase tracking-wider">
            Aguardando pagamento
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingAddons.map((addon) => (
              <div
                key={addon.addon_type}
                className="flex flex-col rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    {ADDON_ICONS[addon.addon_type] ?? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{addon.display_name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(addon.price_monthly)}/mês</p>
                  </div>
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    Pendente
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Acesso liberado automaticamente após confirmação do pagamento.
                </p>
                {messages[addon.addon_type] && (
                  <div className={`mb-3 rounded-lg px-3 py-2 text-xs ${
                    messages[addon.addon_type].type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {messages[addon.addon_type].text}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {addon.payment_link ? (
                    <a
                      href={addon.payment_link}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full rounded-lg bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                    >
                      Pagar agora →
                    </a>
                  ) : (
                    <p className="text-xs text-amber-700 text-center">
                      Link de pagamento enviado para o e-mail cadastrado.
                    </p>
                  )}
                  <button
                    onClick={() => handleCancel(addon.addon_type)}
                    disabled={loading === addon.addon_type}
                    className="w-full rounded-lg border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    {loading === addon.addon_type ? 'Processando…' : 'Cancelar contratação'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Recursos adicionais ativos ──────────────────────────────────────── */}
      {runningAddons.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Recursos adicionais ativos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {runningAddons.map((addon) => (
              <div
                key={addon.addon_type}
                className="flex flex-col rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                    {ADDON_ICONS[addon.addon_type] ?? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{addon.display_name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(addon.price_monthly)}/mês</p>
                  </div>
                  {addon.status === 'past_due' ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      Em atraso
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-semibold text-green-800">
                      Ativo
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 flex-1 mb-3">{addon.description}</p>

                {/* D4: redundancy warning */}
                {addon.is_redundant && (
                  <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                    Este recurso já está incluído no seu plano atual.{' '}
                    <button
                      onClick={() => handleCancel(addon.addon_type)}
                      className="font-semibold underline hover:text-yellow-900"
                    >
                      Cancelar cobrança adicional
                    </button>
                  </div>
                )}

                {messages[addon.addon_type] && (
                  <div className={`mb-3 rounded-lg px-3 py-2 text-xs ${
                    messages[addon.addon_type].type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {messages[addon.addon_type].text}
                  </div>
                )}

                <button
                  onClick={() => handleCancel(addon.addon_type)}
                  disabled={loading === addon.addon_type}
                  className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {loading === addon.addon_type ? 'Processando…' : 'Cancelar recurso'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Recursos disponíveis ────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
          {runningAddons.length > 0 ? 'Adicionar mais' : 'Recursos disponíveis'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available
            .filter((a) => !activeTypes.has(a.addon_type))
            .map((addon) => {
              const colorClass = ADDON_COLORS[addon.addon_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'
              const msg = messages[addon.addon_type]
              return (
                <div
                  key={addon.addon_type}
                  className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorClass}`}>
                      {ADDON_ICONS[addon.addon_type] ?? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{addon.display_name}</p>
                      <p className="text-xs text-primary font-medium">{formatCurrency(addon.price_monthly)}/mês</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 flex-1 mb-4 leading-relaxed">{addon.description}</p>

                  {msg && (
                    <div className={`mb-3 rounded-lg px-3 py-2 text-xs ${
                      msg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
                    }`}>
                      {msg.text}
                    </div>
                  )}

                  <button
                    onClick={() => handleActivate(addon.addon_type)}
                    disabled={loading === addon.addon_type}
                    className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {loading === addon.addon_type ? 'Processando…' : 'Adicionar'}
                  </button>
                </div>
              )
            })}

          {available.filter((a) => !activeTypes.has(a.addon_type)).length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">Você já ativou todos os recursos disponíveis.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
