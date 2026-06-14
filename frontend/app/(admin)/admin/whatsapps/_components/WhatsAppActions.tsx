'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  name: string
  connectionStatus: string
}

export function WhatsAppActions({ name, connectionStatus }: Props) {
  const router = useRouter()
  const [qr, setQR]       = useState<string | null>(null)
  const [msg, setMsg]     = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start]  = useTransition()
  const [showQR, setShowQR] = useState(false)

  function call(path: string, method = 'POST') {
    start(async () => {
      setMsg(null)
      try {
        const res = await fetch(`/api/admin/whatsapp/${encodeURIComponent(name)}/${path}`, { method })
        const json = await res.json()
        if (!res.ok) {
          setMsg({ ok: false, text: json.error ?? 'Erro' })
        } else {
          setMsg({ ok: true, text: path === 'disconnect' ? 'Desconectado!' : 'Reiniciado!' })
          router.refresh()
        }
      } catch {
        setMsg({ ok: false, text: 'Erro de rede' })
      }
    })
  }

  function loadQR() {
    start(async () => {
      setMsg(null)
      try {
        const res = await fetch(`/api/admin/whatsapp/${encodeURIComponent(name)}/qr`)
        const json = await res.json()
        if (!res.ok || !json.base64) {
          setMsg({ ok: false, text: json.error ?? 'QR não disponível' })
        } else {
          setQR(json.base64)
          setShowQR(true)
        }
      } catch {
        setMsg({ ok: false, text: 'Erro de rede' })
      }
    })
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        {connectionStatus === 'open' ? (
          <button
            onClick={() => call('disconnect')}
            disabled={pending}
            className="rounded-md bg-red-900/30 border border-red-800/60 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-900/50 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            Desconectar
          </button>
        ) : (
          <button
            onClick={loadQR}
            disabled={pending}
            className="rounded-md bg-green-900/30 border border-green-800/60 px-2.5 py-1 text-xs font-medium text-green-400 hover:bg-green-900/50 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            Ver QR
          </button>
        )}
        <button
          onClick={() => call('restart')}
          disabled={pending}
          className="rounded-md bg-gray-800 border border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          Reiniciar
        </button>
      </div>
      {msg && (
        <p className={`text-[10px] ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
      )}

      {/* QR Modal */}
      {showQR && qr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="rounded-2xl border border-gray-700 bg-gray-900 p-6 space-y-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">QR Code</h3>
                <p className="text-xs text-gray-500">{name}</p>
              </div>
              <button onClick={() => setShowQR(false)} className="text-gray-600 hover:text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${qr}`}
              alt="QR Code WhatsApp"
              className="w-64 h-64 rounded-lg mx-auto"
            />
            <p className="text-xs text-gray-500">Aponte a câmera do WhatsApp para conectar a instância</p>
          </div>
        </div>
      )}
    </div>
  )
}
