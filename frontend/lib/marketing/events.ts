/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
    ttq?: {
      load: (id: string) => void
      page: () => void
      track: (event: string, params?: Record<string, unknown>) => void
    }
    dataLayer?: any[]
  }
}

function ga(event: string, params?: Record<string, unknown>) {
  try { window.gtag?.('event', event, params) } catch (_) { /* noop */ }
}

function fb(event: string, standard: boolean, params?: Record<string, unknown>) {
  try {
    if (standard) window.fbq?.('track', event, params)
    else window.fbq?.('trackCustom', event, params)
  } catch (_) { /* noop */ }
}

function tt(event: string, params?: Record<string, unknown>) {
  try { window.ttq?.track(event, params) } catch (_) { /* noop */ }
}

export function trackLead() {
  ga('generate_lead', { method: 'form' })
  fb('Lead', true, { lead_type: 'landing_form' })
  tt('SubmitForm')
}

export function trackDemoRequest() {
  ga('demo_request', { method: 'cta' })
  fb('Lead', true, { lead_type: 'demo' })
  tt('PlaceAnOrder')
}

export function trackWhatsApp() {
  ga('whatsapp_click')
  fb('Contact', true)
  tt('Contact')
}

export function trackVideoPlay() {
  ga('video_start', { video_title: 'Demo RevendaClick' })
  fb('ViewContent', true, { content_name: 'Demo Video' })
  tt('ViewContent', { content_name: 'Demo RevendaClick' })
}

export function trackCTAClick(label: string) {
  ga('cta_click', { cta_label: label })
  fb('CTAClick', false, { label })
  tt('ClickButton')
}

export function trackSignupStart() {
  ga('begin_checkout')
  fb('InitiateCheckout', true)
  tt('InitiateCheckout')
}
