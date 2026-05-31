'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCancel() {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?\n\nAo cancelar, todos os recursos adicionais contratados também serão cancelados.\n\nVocê perderá acesso ao encerrar o período atual.')) return

    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/billing/cancel-action', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Erro ao cancelar. Tente novamente.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div>
      <p className="mb-3 text-xs text-gray-500 leading-relaxed">
        Ao cancelar sua assinatura, todos os recursos adicionais contratados também serão cancelados.
      </p>
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-lg border border-red-200 px-4 py-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Cancelando…' : 'Cancelar assinatura'}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}
