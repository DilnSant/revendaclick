'use client'

import { useEffect } from 'react'

export default function ThankYouClient() {
  useEffect(() => {
    try { window.gtag?.('event', 'thank_you_page_view', { page_title: 'Obrigado' }) } catch (_) {}
    try { window.fbq?.('trackCustom', 'ThankYouPageView') } catch (_) {}
    try { window.ttq?.track('CompleteRegistration') } catch (_) {}
  }, [])
  return null
}
