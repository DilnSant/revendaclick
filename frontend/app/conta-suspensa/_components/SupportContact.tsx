'use client'

import { useState } from 'react'

const SUPPORT_EMAIL = 'app.revendaclick@gmail.com'

export function SupportContact() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950/30 p-4 space-y-3 text-sm">
      <p className="text-xs font-medium text-gray-400">Email de suporte</p>
      <p className="text-gray-200 font-mono text-xs break-all">{SUPPORT_EMAIL}</p>
      <button
        onClick={handleCopy}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
          copied
            ? 'border-green-800 bg-green-900/30 text-green-400'
            : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
      >
        {copied ? (
          <>
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Email copiado!
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar Email
          </>
        )}
      </button>
      <p className="text-xs text-gray-600">
        Se o botão não funcionar, envie email diretamente para o endereço acima.
      </p>
    </div>
  )
}
