'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      // Verifica se o e-mail está cadastrado antes de enviar o link
      try {
        const checkRes = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (checkRes.ok) {
          const { exists } = await checkRes.json()
          if (!exists) {
            setError('Nenhuma conta foi encontrada com este endereço de e-mail.')
            return
          }
        }
      } catch {
        // Falha no check: prossegue normalmente para não bloquear o usuário
      }

      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/callback?type=recovery`,
      })

      if (error && error.status === 429) {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
        return
      }
      setSent(true)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image src="/logo-dark.png" alt="RevendaClick" width={1536} height={1024}
              className="object-contain h-28 w-auto max-w-full sm:h-40 lg:h-48" priority />
          </div>
          <h1 className="text-xl font-bold text-white">Recuperar senha</h1>
          <p className="mt-1 text-sm text-gray-400">
            Informe seu email para receber o link de redefinição.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="font-semibold text-green-800">Email enviado!</p>
            <p className="mt-1 text-sm text-green-700">
              Verifique sua caixa de entrada e siga as instruções.
            </p>
            <Link href="/login" className="mt-4 block text-sm font-medium text-primary hover:text-primary-dark">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com.br"
                  className="input"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button type="submit" disabled={isPending} className="btn-primary w-full">
                {isPending ? 'Enviando…' : 'Enviar link'}
              </button>
            </form>

            <Link href="/login" className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-700">
              ← Voltar ao login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
