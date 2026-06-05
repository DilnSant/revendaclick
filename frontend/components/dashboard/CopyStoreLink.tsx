'use client'

import { useState } from 'react'

interface Props {
  slug: string
}

export default function CopyStoreLink({ slug }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `revendaclick.com.br/${slug}`
  const fullUrl = `https://${url}`

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="card p-6">
      <p className="text-sm font-medium text-gray-900">Sua loja pública:</p>
      <div className="mt-2 flex items-center gap-2">
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0 text-primary hover:underline text-sm truncate"
        >
          {url}
        </a>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}
