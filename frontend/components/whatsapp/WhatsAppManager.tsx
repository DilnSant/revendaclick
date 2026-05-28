'use client'

import Image from 'next/image'
import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import type { InstanceStatus } from '@/app/(dashboard)/whatsapp/page'

const TEMPLATES = [
  { label: 'Boas-vindas', text: 'Olá! Obrigado pelo contato. Como posso ajudar?' },
  { label: 'Veículo disponível', text: 'Olá! O veículo que você consultou ainda está disponível. Gostaria de agendar uma visita?' },
  { label: 'Proposta enviada', text: 'Olá! Enviamos uma proposta para você. Ficou com alguma dúvida?' },
  { label: 'Follow-up', text: 'Olá! Passando para verificar se ainda tem interesse. Posso te ajudar com mais informações?' },
]

const RECONNECT_INTERVAL = 30 * 1000

interface QRData {
  code?: string
  base64?: string
}

async function apiFetch<T>(method: string, path: string): Promise<{ data?: T; error?: string; unavailable?: boolean }> {
  try {
    const res = await fetch(path, { method })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const errObj = json.error
      const msg = typeof errObj === 'string'
        ? errObj
        : (errObj?.message ?? `Erro ${res.status}`)
      const unavailable = res.status === 503 || errObj?.code === 'evolution_unavailable'
      return { error: msg, unavailable }
    }
    return { data: (json.data ?? json) as T }
  } catch {
    return { error: 'Falha de conexão com o servidor', unavailable: true }
  }
}

const STATUS_COLORS: Record<string, string> = {
  open:         'bg-green-100 text-green-700',
  connecting:   'bg-yellow-100 text-yellow-700',
  disconnected: 'bg-gray-100 text-gray-500',
  close:        'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  open:         'Canal conectado',
  connecting:   'Conectando…',
  disconnected: 'Canal desconectado',
  close:        'Canal desconectado',
}

export default function WhatsAppManager({
  initialStatus,
  tenantSlug,
}: {
  initialStatus: InstanceStatus
  tenantSlug: string
}) {
  const [status, setStatus] = useState(initialStatus)
  const [qr, setQr] = useState<QRData | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [serviceDown, setServiceDown] = useState(false)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [sendModal, setSendModal] = useState(false)
  const [sendPhone, setSendPhone] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sending, setSending] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const refreshStatus = useCallback(async () => {
    const result = await apiFetch<InstanceStatus>('GET', '/api/evolution/status')
    if (result.data) {
      setStatus(result.data)
      if (result.data.status === 'open') setServiceDown(false)
    } else if (result.unavailable) {
      setServiceDown(true)
    }
  }, [])

  useEffect(() => {
    if (!serviceDown) {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRetryCountdown(null)
      return
    }
    let seconds = 30
    setRetryCountdown(seconds)
    const countdown = setInterval(() => {
      seconds -= 1
      setRetryCountdown(seconds)
      if (seconds <= 0) clearInterval(countdown)
    }, 1000)
    const retryId = setTimeout(async () => {
      const result = await apiFetch('GET', '/api/evolution/health')
      if (!result.error) {
        setServiceDown(false)
        showToast('Canal de atendimento restaurado.')
        refreshStatus()
      }
    }, 30000)
    retryTimerRef.current = retryId as unknown as ReturnType<typeof setInterval>
    return () => {
      clearInterval(countdown)
      clearTimeout(retryId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceDown])

  useEffect(() => {
    if (status.status !== 'connecting') return
    const id = setInterval(refreshStatus, 5000)
    return () => clearInterval(id)
  }, [status.status, refreshStatus])

  useEffect(() => {
    if (status.status !== 'disconnected') return
    const id = setInterval(refreshStatus, RECONNECT_INTERVAL)
    return () => clearInterval(id)
  }, [status.status, refreshStatus])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (status.status === 'open') setQr(null)
  }, [status.status])

  function handleConnect() {
    setServiceDown(false)
    startTransition(async () => {
      const result = await apiFetch<QRData>('POST', '/api/evolution/connect')
      if (result.error) {
        if (result.unavailable) { setServiceDown(true) } else { showToast(result.error) }
        return
      }
      setQr(result.data ?? null)
      setStatus(prev => ({ ...prev, status: 'connecting' }))
      showToast('QR code gerado. Conecte pelo aplicativo WhatsApp.')
    })
  }

  function handleRefreshQR() {
    setServiceDown(false)
    startTransition(async () => {
      const result = await apiFetch<QRData>('GET', '/api/evolution/qr')
      if (result.error) {
        if (result.unavailable) { setServiceDown(true) } else { showToast(result.error) }
        return
      }
      setQr(result.data ?? null)
      setStatus(prev => ({ ...prev, status: 'connecting' }))
    })
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!sendPhone || !sendMessage) return
    setSending(true)
    try {
      const res = await fetch('/api/evolution/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sendPhone, message: sendMessage }),
      })
      if (res.ok) {
        showToast('Mensagem enviada com sucesso!')
        setSendModal(false)
        setSendPhone('')
        setSendMessage('')
      } else {
        const json = await res.json().catch(() => ({}))
        showToast(json.error?.message ?? 'Erro ao enviar mensagem.')
      }
    } finally {
      setSending(false)
    }
  }

  function handleRefreshStatusManual() {
    startTransition(async () => {
      const result = await apiFetch<InstanceStatus>('GET', '/api/evolution/status')
      if (result.error) {
        if (result.unavailable) { setServiceDown(true) } else { showToast('Erro ao verificar status: ' + result.error) }
        return
      }
      if (result.data) {
        setStatus(result.data)
        if (result.data.status === 'open') setServiceDown(false)
        const label = result.data.status === 'open' ? 'Canal conectado' : result.data.status === 'connecting' ? 'Conectando…' : 'Canal desconectado'
        showToast('Status atualizado: ' + label)
      }
    })
  }

  function handleDisconnect() {
    if (!confirm('Desconectar o canal de atendimento? Você precisará reconectar via QR code.')) return
    startTransition(async () => {
      const result = await apiFetch('DELETE', '/api/evolution/disconnect')
      if (result.error) { showToast(result.error); return }
      setStatus({ instance_name: tenantSlug, status: 'disconnected' })
      setQr(null)
      showToast('Canal desconectado.')
    })
  }

  const isConnected   = status.status === 'open'
  const isConnecting  = status.status === 'connecting'
  const isDisconnected = !isConnected && !isConnecting

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Service unavailable banner */}
      {serviceDown && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800">Canal de atendimento temporariamente indisponível</p>
              <p className="mt-1 text-xs text-orange-700">
                O serviço está iniciando ou reiniciando.{' '}
                {retryCountdown !== null && retryCountdown > 0
                  ? `Verificando novamente em ${retryCountdown}s…`
                  : 'Tentando reconectar…'}
              </p>
            </div>
            <button
              onClick={() => setServiceDown(false)}
              className="text-orange-400 hover:text-orange-600 text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Status card */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold
              ${isConnected ? 'bg-green-100' : isConnecting ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              {isConnected ? '✓' : isConnecting ? '⟳' : '!'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Canal: <span className="font-mono text-sm">{status.instance_name || tenantSlug}</span>
              </p>
              <span className={`inline-block mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status.status] ?? STATUS_COLORS.disconnected}`}>
                {STATUS_LABELS[status.status] ?? status.status}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefreshStatusManual}
              disabled={pending}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {pending ? 'Verificando…' : 'Atualizar status'}
            </button>
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={pending}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={pending}
                className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
              >
                {pending ? 'Aguarde…' : 'Conectar canal'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Code display */}
      {qr && !isConnected && (
        <div className="card p-6 text-center space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Conecte seu canal de atendimento pelo aplicativo WhatsApp
          </h2>
          <p className="text-sm text-gray-500">
            Abra o WhatsApp → Dispositivos conectados → Conectar um dispositivo → Escaneie o código abaixo
          </p>

          {qr.base64 ? (
            <div className="flex justify-center">
              <Image
                src={`data:image/png;base64,${qr.base64}`}
                alt="QR Code — Central de Atendimento"
                width={256}
                height={256}
                className="rounded-lg border border-gray-200 shadow-sm"
                unoptimized
              />
            </div>
          ) : qr.code ? (
            <div className="mx-auto max-w-xs break-all rounded-lg bg-gray-50 p-4 text-xs font-mono text-gray-600 border border-gray-200">
              {qr.code}
            </div>
          ) : (
            <p className="text-sm text-gray-400">QR code indisponível. Tente gerar novamente.</p>
          )}

          <button
            onClick={handleRefreshQR}
            disabled={pending}
            className="btn-secondary text-xs"
          >
            Gerar novo QR code
          </button>

          <p className="text-xs text-gray-400">
            O QR code expira em ~60 segundos. Clique em &ldquo;Gerar novo QR code&rdquo; se expirar.
          </p>
        </div>
      )}

      {/* Send message modal */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Enviar mensagem de atendimento</h2>
              <button onClick={() => setSendModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="label">Número do cliente</label>
                <input
                  type="tel"
                  value={sendPhone}
                  onChange={e => setSendPhone(e.target.value)}
                  placeholder="5511999999999"
                  required
                  className="input"
                />
                <p className="mt-1 text-xs text-gray-400">Código do país + DDD + número. Exemplo: 5511999999999</p>
              </div>

              <div>
                <label className="label">Mensagem</label>
                <div className="mb-2 flex flex-wrap gap-1">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setSendMessage(t.text)}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={sendMessage}
                  onChange={e => setSendMessage(e.target.value)}
                  placeholder="Digite sua mensagem de atendimento…"
                  required
                  rows={4}
                  maxLength={4096}
                  className="input resize-none"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">{sendMessage.length}/4096</p>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setSendModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={sending} className="btn-primary flex-1">
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info when connected */}
      {isConnected && (
        <div className="card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Canal conectado</h2>
            <button
              onClick={() => setSendModal(true)}
              className="btn-primary text-xs py-1.5 px-3"
            >
              Enviar mensagem
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Clientes que enviarem mensagens para seu WhatsApp serão registrados automaticamente como leads no CRM.
          </p>
          <div className="rounded-lg bg-green-50 border border-green-100 p-4">
            <p className="text-sm font-medium text-green-800">Automação ativa</p>
            <p className="mt-1 text-xs text-green-700">
              Mensagem recebida → lead criado ou atualizado → atividade registrada no CRM → equipe notificada
            </p>
          </div>
        </div>
      )}

      {/* Info when disconnected */}
      {isDisconnected && !qr && (
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Como funciona a Central de Atendimento</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Clique em &ldquo;Conectar canal&rdquo; e escaneie o QR code com o WhatsApp da revenda</li>
            <li>Clientes que enviarem mensagens são criados automaticamente como leads no CRM</li>
            <li>Cada mensagem é registrada como atividade na linha do tempo do lead</li>
            <li>A equipe de atendimento acompanha e responde pelo painel de Leads</li>
          </ol>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium text-blue-800">Canal exclusivo de atendimento e CRM</p>
            <p className="mt-0.5 text-xs text-blue-700">
              Este canal é utilizado para atendimento individual de leads e clientes — não para envios em massa.
              Para configurar o botão público de contato da loja, acesse Configurações → Contato Público.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
