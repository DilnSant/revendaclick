'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

/**
 * Revela o conteúdo quando ele entra na viewport.
 *
 * O respeito a prefers-reduced-motion fica em CSS (classe .reveal em
 * globals.css), não em estado do React: assim o conteúdo nasce visível
 * para quem pediu menos movimento, sem render extra nem risco de ficar
 * invisível caso o observer não dispare.
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  /** Atraso em ms — use para escalonar itens de uma grade. */
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : undefined }}
      className={`reveal ${shown ? 'is-shown' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
