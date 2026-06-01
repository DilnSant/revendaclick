import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ThankYouClient from './ThankYouClient'

export const metadata: Metadata = {
  title: 'Solicitação recebida | RevendaClick',
  description: 'Obrigado pelo interesse no RevendaClick. Nossa equipe vai entrar em contato em breve.',
  robots: { index: false, follow: false },
}

const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? '5511999999999'
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Ol%C3%A1!%20Acabei%20de%20preencher%20o%20formul%C3%A1rio%20no%20site%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20RevendaClick.`

export default function ObrigadoPage() {
  return (
    <>
      <ThankYouClient />

      <div className="flex min-h-screen flex-col items-center justify-center bg-graphite px-6 py-16">
        {/* Logo */}
        <Link href="/" aria-label="Voltar para o início">
          <Image
            src="/logo.png"
            alt="RevendaClick"
            width={160}
            height={40}
            className="mb-12 h-8 w-auto object-contain brightness-200"
          />
        </Link>

        {/* Card */}
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur">
          {/* Success icon */}
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20"
            aria-hidden
          >
            <svg
              className="h-10 w-10 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Confirmamos sua solicitação.
          </h1>

          <p className="mt-4 text-base leading-relaxed text-gray-400">
            Nossa equipe vai entrar em contato em breve pelo WhatsApp ou telefone
            que você informou. Fique de olho nas mensagens!
          </p>

          {/* Next steps */}
          <ol
            className="mt-8 space-y-4 text-left"
            aria-label="O que acontece agora"
          >
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-3">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-green-600 active:scale-[0.98]"
              aria-label="Falar com a equipe pelo WhatsApp agora"
            >
              <WhatsAppIcon />
              Falar pelo WhatsApp agora
            </a>

            <Link
              href="/register?demo=1"
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-primary-dark active:scale-[0.98]"
            >
              Agendar demonstração →
            </Link>

            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Criar conta gratuita →
            </Link>

            <Link
              href="/#planos"
              className="mt-1 text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              Conhecer os planos →
            </Link>

            <Link
              href="/"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Voltar para o início
            </Link>
          </div>
        </div>

        {/* Trust */}
        <p className="mt-8 text-[11px] text-gray-600">
          Seus dados estão seguros e não serão compartilhados com terceiros.
        </p>
      </div>
    </>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.554 4.112 1.522 5.843L.057 23.57a.5.5 0 00.61.637l5.917-1.516A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.942 9.942 0 01-5.13-1.427l-.368-.217-3.813.977.997-3.692-.239-.381A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  )
}

const STEPS = [
  {
    title: 'Em minutos',
    desc: 'Analisamos seu perfil e preparamos uma demonstração personalizada para o seu porte de loja.',
  },
  {
    title: 'Em até 2h (dias úteis)',
    desc: 'Um especialista da equipe RevendaClick entra em contato pelo WhatsApp ou telefone informado.',
  },
  {
    title: 'Demonstração ao vivo',
    desc: 'Você vê a plataforma rodando com veículos e dados similares ao da sua revenda.',
  },
]
