import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos de Uso — RevendaClick',
  description: 'Termos e condições de uso da plataforma RevendaClick.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/95">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-6">
          <Link href="/" className="text-sm font-semibold text-primary hover:text-primary/80">
            ← RevendaClick
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-heading font-bold text-graphite mb-2">Termos de Uso</h1>
        <p className="text-sm text-gray-400 mb-8">Última atualização: maio de 2025</p>

        <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-gray-900 mt-6">1. Aceitação</h2>
          <p>
            Ao criar uma conta e utilizar a plataforma RevendaClick, você concorda com estes Termos de Uso.
            Se você não concorda, não utilize o serviço.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">2. Descrição do serviço</h2>
          <p>
            RevendaClick é uma plataforma SaaS para gestão de revendas de veículos, oferecendo ferramentas de
            CRM, estoque, financeiro, leads e integração com WhatsApp. O serviço é fornecido &quot;como está&quot;,
            sujeito a disponibilidade.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">3. Uso permitido</h2>
          <p>
            Você pode usar a plataforma para gerenciar sua revenda de veículos de forma legal. É proibido:
            usar a plataforma para atividades ilegais, tentar acessar dados de outras contas, fazer engenharia
            reversa ou revender o acesso à plataforma sem autorização.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">4. Pagamento e trial</h2>
          <p>
            O período trial é de 30 dias, sem cobrança. Após o trial, a continuação requer assinatura de um
            plano. Cobranças são realizadas via Asaas (boleto, PIX ou cartão de crédito). O cancelamento pode
            ser feito a qualquer momento, com acesso mantido até o fim do período pago.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">5. Dados</h2>
          <p>
            Você é responsável pelos dados inseridos na plataforma. A RevendaClick não se responsabiliza por
            dados incorretos ou uso indevido das ferramentas. Consulte nossa Política de Privacidade para
            detalhes sobre armazenamento e uso de dados.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">6. Alterações</h2>
          <p>
            Reservamo-nos o direito de alterar estes termos. Notificações serão enviadas com 30 dias de
            antecedência para mudanças significativas. O uso continuado após a data de vigência implica
            aceitação dos novos termos.
          </p>

          <h2 className="text-lg font-semibold text-gray-900 mt-6">7. Contato</h2>
          <p>
            Dúvidas:{' '}
            <a href="mailto:contato@revendaclick.com.br" className="text-primary hover:underline">
              contato@revendaclick.com.br
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
