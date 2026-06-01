import Link from 'next/link'
import Image from 'next/image'

const YEAR = new Date().getFullYear()

export default function FooterSection() {
  return (
    <footer className="border-t border-gray-100 bg-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" aria-label="RevendaClick — página inicial">
              <Image
                src="/logo.png"
                alt="RevendaClick"
                width={160}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
              A plataforma que acelera sua revenda. Centralize estoque, divulgue
              veículos e aumente as vendas com tecnologia criada para lojistas.
            </p>
            <p className="mt-6 text-xs text-gray-400">
              © {YEAR} RevendaClick. Todos os direitos reservados.
            </p>
          </div>

          {/* Recursos */}
          <nav aria-label="Links de recursos">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Recursos
            </h3>
            <ul className="space-y-3">
              {RESOURCE_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-gray-500 transition-colors hover:text-graphite"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Empresa */}
          <nav aria-label="Links institucionais">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Empresa
            </h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-500 transition-colors hover:text-graphite"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            Desenvolvido com ❤️ para lojas de veículos brasileiras.
          </p>
          <div className="flex gap-5">
            <Link
              href="/privacy"
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/terms"
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

const RESOURCE_LINKS = [
  { href: '#recursos', label: 'Funcionalidades' },
  { href: '#planos', label: 'Planos' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#faq', label: 'FAQ' },
]

const COMPANY_LINKS = [
  { href: '/login', label: 'Entrar' },
  { href: '/register', label: 'Criar conta' },
  { href: '/privacy', label: 'Privacidade' },
  { href: '/terms', label: 'Termos de Uso' },
]
