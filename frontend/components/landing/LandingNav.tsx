'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ConversionLink from '@/components/marketing/ConversionLink'

const LINKS = [
  { href: '#perdas', label: 'O problema' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#calculadora', label: 'Calculadora' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#faq', label: 'Dúvidas' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trava o scroll do body enquanto o menu mobile está aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/[0.08] bg-[#07080B]/85 backdrop-blur-xl' : ''
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <Link href="/" className="font-heading text-lg font-bold tracking-tight text-white">
          Revenda<span className="text-primary">Click</span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Entrar
          </Link>
          <ConversionLink
            href="/register"
            variant="signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-brand transition-transform hover:scale-[1.03]"
          >
            Testar grátis
          </ConversionLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div
          id="menu-mobile"
          className="border-t border-white/[0.08] bg-[#07080B]/97 px-5 pb-8 pt-4 backdrop-blur-xl lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base text-white/75 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-3">
            <ConversionLink
              href="/register"
              variant="signup"
              className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Começar teste gratuito
            </ConversionLink>
            <Link
              href="/login"
              className="rounded-xl border border-white/[0.12] px-4 py-3 text-center text-sm font-medium text-white/80"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
