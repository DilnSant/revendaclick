'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import type { InstanceStatus } from '@/app/(dashboard)/whatsapp/page'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface QRData {
  code?: string
  base64?: string
}

async function getToken(): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? ''
}

async function apiFetch<T>(method: string, path: string): Promise<{ data?: T; error?: string }> {
  const token = await getToken()
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { error: json.error?.message ?? 'Erro inesperado' }
    return { data: (json.data ?? json) as T }
  } catch {
    return { error: 'Falha de conexão' }
  }
}

const STATUS_COLORS: Record<string, string> = {
  open:         'bg-green-100 text-green-700',
  connecting:   'bg-yellow-100 text-yellow-700',
  disconnected: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  open:         'Conectado',
  connecting:   'Conectando…',
  disconnected: 'Desconectado',
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
  const [pending, startTransition] = useTransition()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const refreshStatus = useCallback(async () => {
    const result = await apiFetch<InstanceStatus>('GET', '/api/evolution/status')
    if (result.data) setStatus(result.data)
  }, [])

  // Poll status every 5s when connecting
  useEffect(() => {
    if (status.status !== 'connecting') return
    const id = setInterval(refreshStatus, 5000)
    return () => clearInterval(id)
  }, [status.status, refreshStatus])

  // Clear QR once connected
  useEffect(() => {
    if (status.status === 'open') setQr(null)
  }, [status.status])

  function handleConnect() {
    startTransition(async () => {
      const result = await apiFetch<QRData>('POST', '/api/evolution/connect')
      if (result.error) { showToast(result.error); return }
      setQr(result.data ?? null)
      setStatus(prev => ({ ...prev, status: 'connecting' }))
      showToast('QR code gerado. Escaneie com seu WhatsApp.')
    })
  }

  function handleRefreshQR() {
    startTransition(async () => {
      const result = await apiFetch<QRData>('GET', '/api/evolution/qr')
      if (result.error) { showToast(result.error); return }
      setQr(result.data ?? null)
    })
  }

  function handleDisconnect() {
    if (!confirm('Desconectar WhatsApp? Você precisará escanear o QR code novamente.')) return
    startTransition(async () => {
      const result = await apiFetch('DELETE', '/api/evolution/disconnect')
      if (result.error) { showToast(result.error); return }
      setStatus({ instance_name: tenantSlug, status: 'disconnected' })
      setQr(null)
      showToast('WhatsApp desconectado.')
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
                Instância: <span className="font-mono text-sm">{status.instance_name || tenantSlug}</span>
              </p>
              <span className={`inline-block mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status.status] ?? STATUS_COLORS.disconnected}`}>
                {STATUS_LABELS[status.status] ?? status.status}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refreshStatus}
              disabled={pending}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Atualizar status
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
                {pending ? 'Aguarde…' : 'Conectar WhatsApp'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Code display */}
      {qr && isConnecting && (
        <div className="card p-6 text-center space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Escaneie o QR code com seu WhatsApp</h2>
          <p className="text-sm text-gray-500">
            Abra o WhatsApp → Dispositivos conectados → Conectar um dispositivo → Escaneie o código
          </p>

          {qr.base64 ? (
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${qr.base64}`}
                alt="QR Code WhatsApp"
                className="h-64 w-64 rounded-lg border border-gray-200 shadow-sm"
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
            O QR code expira em ~60 segundos. Clique em "Gerar novo QR code" se expirar.
          </p>
        </div>
      )}

      {/* Info when connected */}
      {isConnected && (
        <div className="card p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">WhatsApp conectado</h2>
          <p className="text-sm text-gray-600">
            Leads enviando mensagens para seu WhatsApp serão automaticamente registrados no CRM.
          </p>
          <div className="rounded-lg bg-green-50 border border-green-100 p-4">
            <p className="text-sm font-medium text-green-800">Webhook ativo</p>
            <p className="mt-1 text-xs text-green-700">
              Mensagens recebidas → lead criado ou atualizado → atividade registrada no CRM
            </p>
          </div>
        </div>
      )}

      {/* Info when disconnected */}
      {isDisconnected && !qr && (
        <div className="card p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Como funciona</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Clique em "Conectar WhatsApp"</li>
            <li>Escaneie o QR code com o WhatsApp da sua revenda</li>
            <li>Leads que enviarem mensagens serão criados automaticamente no CRM</li>
            <li>Mensagens são registradas como atividades na linha do tempo do lead</li>
          </ol>
        </div>
      )}
    </div>
  )
}
