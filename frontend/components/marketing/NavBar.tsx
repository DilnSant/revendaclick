'use client'

import { useState } from 'react'
import ConversionLink from './ConversionLink'

const NAV_LINKS = [
  { href: '#recursos',       label: 'Recursos' },
  { href: '#como-funciona',  label: 'Como funciona' },
  { href: '#planos',         label: 'Planos' },
  { href: '#faq',            label: 'FAQ' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-graphite/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <ConversionLink href="/" variant="generic" label="logo" className="flex-shrink-0">
          <span
            className="font-heading text-2xl font-bold tracking-tight"
            aria-label="RevendaClick"
          >
            <span className="text-white">Revenda</span><span className="text-primary">Click</span>
          </span>
        </ConversionLink>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex" role="navigation" aria-label="Menu principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ConversionLink
            href="/login"
            variant="generic"
            label="nav_login"
            className="text-sm font-semibold text-gray-300 transition-colors hover:text-white"
          >
            Entrar
          </ConversionLink>
          <ConversionLink
            href="/register"
            variant="signup"
            className="btn-primary"
          >
            Começar grátis
          </ConversionLink>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white md:hidden"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-graphite px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Menu mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-4">
              <ConversionLink
                href="/login"
                variant="generic"
                label="mobile_login"
                className="text-center text-sm font-semibold text-gray-300 hover:text-white"
              >
                Entrar
              </ConversionLink>
              <ConversionLink
                href="/register"
                variant="signup"
                className="btn-primary w-full justify-center"
              >
                Começar grátis
              </ConversionLink>
            </div>
          </nav>
        </div>
      )}
    </nav>
  )
}
