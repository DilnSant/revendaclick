import Link from 'next/link'

const ANO = new Date().getFullYear()

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.07] px-5 py-14 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="font-heading text-lg font-bold tracking-tight text-white">
              Revenda<span className="text-primary">Click</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/45">
              Plataforma de gestão e vendas para revendas de veículos.
            </p>
          </div>

          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/35">
                Plataforma
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li><a href="#recursos" className="text-sm text-white/55 transition-colors hover:text-white">Recursos</a></li>
                <li><a href="#como-funciona" className="text-sm text-white/55 transition-colors hover:text-white">Como funciona</a></li>
                <li><a href="#calculadora" className="text-sm text-white/55 transition-colors hover:text-white">Calculadora</a></li>
                <li><a href="#faq" className="text-sm text-white/55 transition-colors hover:text-white">Dúvidas</a></li>
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/35">
                Conta
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/register" className="text-sm text-white/55 transition-colors hover:text-white">Criar conta</Link></li>
                <li><Link href="/login" className="text-sm text-white/55 transition-colors hover:text-white">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/35">
                Legal
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/privacidade" className="text-sm text-white/55 transition-colors hover:text-white">Privacidade</Link></li>
                <li><Link href="/terms" className="text-sm text-white/55 transition-colors hover:text-white">Termos de uso</Link></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/[0.07] pt-7">
          <p className="text-xs text-white/30">
            © {ANO} RevendaClick. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
