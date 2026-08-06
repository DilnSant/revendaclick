/**
 * Primitivas visuais da landing (tema escuro premium).
 *
 * Sem dependências externas: ícones são SVG inline e as animações usam
 * as keyframes já declaradas em app/globals.css + IntersectionObserver.
 */
import { ReactNode } from 'react'

/* ── Layout ────────────────────────────────────────────────────────────── */

export function Section({
  id,
  children,
  className = '',
  label,
}: {
  id?: string
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className={`relative px-5 py-20 sm:px-8 sm:py-28 lg:py-32 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
      {children}
    </span>
  )
}

export function Heading({
  children,
  as: Tag = 'h2',
  className = '',
}: {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3'
  className?: string
}) {
  const size =
    Tag === 'h1'
      ? 'text-4xl sm:text-5xl lg:text-6xl'
      : 'text-3xl sm:text-4xl lg:text-[2.75rem]'
  return (
    <Tag
      className={`font-heading font-bold leading-[1.08] tracking-[-0.02em] text-white ${size} ${className}`}
    >
      {children}
    </Tag>
  )
}

export function Lead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-base leading-relaxed text-white/60 sm:text-lg ${className}`}>{children}</p>
  )
}

/** Cabeçalho padrão de seção — centralizado, com largura de leitura controlada. */
export function SectionHead({
  eyebrow,
  title,
  lead,
  align = 'center',
}: {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  align?: 'center' | 'left'
}) {
  const alignment = align === 'center' ? 'mx-auto text-center items-center' : 'text-left items-start'
  return (
    <div className={`flex max-w-3xl flex-col gap-5 ${alignment}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading>{title}</Heading>
      {lead && <Lead>{lead}</Lead>}
    </div>
  )
}

/* ── Superfícies ───────────────────────────────────────────────────────── */

export function Card({
  children,
  className = '',
  hover = true,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 ${
        hover ? 'hover:border-white/[0.16] hover:bg-white/[0.055]' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

/** Brilho radial decorativo. Puramente estético — sempre aria-hidden. */
export function Glow({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`}
    />
  )
}

/* ── Animação de entrada por scroll ────────────────────────────────────── */

export { default as Reveal } from './Reveal'

/* ── Ícones (SVG inline, 24x24, currentColor) ──────────────────────────── */

type IconProps = { className?: string }
const base = 'h-6 w-6'
const svg = (d: ReactNode, extra?: string) =>
  function Icon({ className = '' }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`${base} ${extra ?? ''} ${className}`}
      >
        {d}
      </svg>
    )
  }

export const IconUsers = svg(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </>,
)
export const IconChat = svg(
  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
)
export const IconCar = svg(
  <>
    <path d="M5 17h14M6.5 17V19a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2M20.5 17V19a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2" />
    <path d="M3 17v-4.2a2 2 0 0 1 .2-.9l1.9-3.8A2 2 0 0 1 6.9 7h10.2a2 2 0 0 1 1.8 1.1l1.9 3.8a2 2 0 0 1 .2.9V17" />
    <circle cx="7.5" cy="14" r="1" />
    <circle cx="16.5" cy="14" r="1" />
  </>,
)
export const IconWallet = svg(
  <>
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" />
    <path d="M16 12.5h.01" />
  </>,
)
export const IconChart = svg(
  <>
    <path d="M3 3v18h18" />
    <path d="M7 15l4-4 3 3 5-6" />
  </>,
)
export const IconStore = svg(
  <>
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M4 9v11h16V9" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M10 20v-5h4v5" />
  </>,
)
export const IconSpark = svg(
  <>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
  </>,
)
export const IconShield = svg(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </>,
)
export const IconClock = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
)
export const IconLock = svg(
  <>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </>,
)
export const IconCheck = svg(<path d="M4 12.5l5 5L20 6.5" />)
export const IconX = svg(
  <>
    <path d="M6 6l12 12M18 6L6 18" />
  </>,
)
export const IconArrow = svg(<path d="M5 12h14M13 6l6 6-6 6" />)
export const IconAlert = svg(
  <>
    <path d="M12 3l9.5 16.5H2.5z" />
    <path d="M12 10v4M12 17.5h.01" />
  </>,
)
export const IconStar = svg(
  <path d="M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.5l6.3-.9z" />,
)
