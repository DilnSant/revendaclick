import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — RevendaClick',
  description: 'Como coletamos, usamos e protegemos seus dados.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/95">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-6">
          <Link href="/" className="text-sm font-semibold text-primary hover:text-primary/80">
            ← RevendaClick
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12 prose prose-gray">
        <h1 className="text-3xl font-heading font-bold text-graphite mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-400 mb-8">Última atualização: maio de 2025</p>

        <section className="space-y-4 text-gray-600 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-gray-900 mt-6">1. Coleta de dados</h2>
          <p>
            Coletamos dados necessários para o funcionamento da plataforma: nome, e-mail, WhatsApp e informações da sua loja.
            Dados de veículos, clientes e leads são inseridos por você e armazenados com segurança.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">2. Uso dos dados</h2>
          <p>
            Seus dados são usados exclusivamente para: operar a plataforma RevendaClick, enviar comunicações
            relacionadas ao serviço (faturas, alertas de conta) e melhorar a experiência do produto.
            Nunca vendemos ou compartilhamos seus dados com terceiros para fins de marketing.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">3. Segurança</h2>
          <p>
            Utilizamos criptografia (HTTPS/TLS), autenticação JWT, isolamento multi-tenant e Row Level Security
            no banco de dados. Cada conta acessa exclusivamente seus próprios dados.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">4. Retenção</h2>
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. Após cancelamento, os dados são mantidos
            por 90 dias para possível reativação, após o que são excluídos permanentemente mediante solicitação.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">5. Seus direitos</h2>
          <p>
            Você tem direito de acessar, corrigir ou solicitar a exclusão dos seus dados a qualquer momento.
            Entre em contato pelo e-mail: <a href="mailto:contato@revendaclick.com.br" className="text-primary hover:underline">contato@revendaclick.com.br</a>
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">6. Contato</h2>
          <p>
            Dúvidas sobre privacidade: <a href="mailto:contato@revendaclick.com.br" className="text-primary hover:underline">contato@revendaclick.com.br</a>
          </p>
        </section>
      </main>
    </div>
  )
}
