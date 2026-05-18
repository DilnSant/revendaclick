'use client'

import { useEffect } from 'react'
import { captureError } from '@/lib/error-tracking'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    captureError(error, { digest: error.digest, location: 'dashboard' })
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">Algo deu errado</h2>
        <p className="mt-1 text-sm text-gray-500">
          Não foi possível carregar esta página. Tente novamente.
        </p>
      </div>
      <button
        onClick={reset}
        className="btn-primary"
      >
        Tentar novamente
      </button>
    </div>
  )
}
