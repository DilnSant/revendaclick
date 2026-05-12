'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/callback?type=recovery`,
      })

      if (error) {
        setError('Não foi possível enviar o email. Verifique o endereço informado.')
        return
      }
      setSent(true)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-xl font-bold text-white">
            RC
          </div>
          <h1 className="text-xl font-bold text-gray-900">Recuperar senha</h1>
          <p className="mt-1 text-sm text-gray-500">
            Informe seu email para receber o link de redefinição.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="font-semibold text-green-800">Email enviado!</p>
            <p className="mt-1 text-sm text-green-700">
              Verifique sua caixa de entrada e siga as instruções.
            </p>
            <Link href="/login" className="mt-4 block text-sm font-medium text-red-600 hover:text-red-700">
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
