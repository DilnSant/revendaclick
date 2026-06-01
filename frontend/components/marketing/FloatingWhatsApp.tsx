'use client'

import { useState, useEffect } from 'react'
import { trackWhatsApp } from '@/lib/marketing/events'

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? '5511999999999'
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Ol%C3%A1!%20Quero%20conhecer%20o%20RevendaClick.`

export default function FloatingWhatsApp() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3_000)
    const onScroll = () => {
      if (window.scrollY > 400) setVisible(true)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (dismissed || !visible) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex animate-fade-in flex-col items-end gap-2"
      role="complementary"
      aria-label="Atendimento via WhatsApp"
    >
      {/* Dismiss */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Fechar botão de WhatsApp"
        className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-500 opacity-70 transition-opacity hover:opacity-100"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Button */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackWhatsApp}
        aria-label="Falar com a equipe RevendaClick pelo WhatsApp"
        className="group flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-3 shadow-[0_8px_32px_rgba(37,211,102,0.4)] transition-all hover:scale-105 hover:shadow-[0_8px_40px_rgba(37,211,102,0.55)] active:scale-[0.98]"
      >
        <WhatsAppIcon />
        <span className="text-sm font-bold text-white">Falar no WhatsApp</span>

        {/* Pulse dot */}
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
      </a>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.554 4.112 1.522 5.843L.057 23.57a.5.5 0 00.61.637l5.917-1.516A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.942 9.942 0 01-5.13-1.427l-.368-.217-3.813.977.997-3.692-.239-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}
