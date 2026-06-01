'use client'

import Link from 'next/link'
import { trackDemoRequest, trackWhatsApp, trackCTAClick, trackSignupStart } from '@/lib/marketing/events'

type Variant = 'demo' | 'whatsapp' | 'signup' | 'generic'

interface Props {
  href: string
  variant?: Variant
  label?: string
  external?: boolean
  className?: string
  children: React.ReactNode
}

export default function ConversionLink({
  href,
  variant = 'generic',
  label,
  external = false,
  className,
  children,
}: Props) {
  function handleClick() {
    switch (variant) {
      case 'demo':    trackDemoRequest(); break
      case 'whatsapp': trackWhatsApp();   break
      case 'signup':  trackSignupStart(); break
      default:        trackCTAClick(label ?? href)
    }
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={className}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
