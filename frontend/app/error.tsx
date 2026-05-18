'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { captureError } from '@/lib/error-tracking'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    captureError(error, { digest: error.digest, location: 'global' })
  }, [error])

  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Erro inesperado</h1>
            <p className="mt-2 text-sm text-gray-500">
              Algo deu errado. Nossa equipe foi notificada.
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-gray-400">Código: {error.digest}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Tentar novamente
            </button>
            <Link
              href="/"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
