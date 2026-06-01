'use client'

import { useEffect } from 'react'
import { trackVideoPlay } from '@/lib/marketing/events'

interface Props {
  onClose: () => void
}

const VIDEO_ID = process.env.NEXT_PUBLIC_DEMO_VIDEO_ID

export default function VideoModal({ onClose }: Props) {
  useEffect(() => {
    trackVideoPlay()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal
      aria-label="Vídeo demonstrativo do RevendaClick"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-4xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar vídeo"
          className="absolute -top-10 right-0 flex items-center gap-1.5 text-sm text-gray-300 transition-colors hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Fechar
        </button>

        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
          {VIDEO_ID ? (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
                title="Demonstração RevendaClick"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-graphite-700">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <svg className="h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-heading text-base font-bold text-white">Vídeo em produção</p>
                <p className="mt-1 text-sm text-gray-400">
                  Configure{' '}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-primary-light">
                    NEXT_PUBLIC_DEMO_VIDEO_ID
                  </code>{' '}
                  com o ID do YouTube.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
