import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Política de Privacidade | RevendaClick',
  description:
    'Saiba como o RevendaClick coleta, utiliza e protege seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).',
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/privacidade` },
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para o início
        </Link>

        <header className="mb-12 border-b border-gray-100 pb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-600">
            RevendaClick
          </p>
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
            Política de Privacidade
          </h1>
          <p className="mt-4 text-sm text-gray-500">
            Vigência: 1º de junho de 2026. Esta política pode ser atualizada periodicamente — a
            data de vigência acima será revisada a cada alteração relevante.
          </p>
        </header>

        <div className="space-y-10 text-gray-700 leading-relaxed">

          {/* 1. Controlador */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              1. Controlador dos Dados
            </h2>
            <p>
              O controlador responsável pelo tratamento dos seus dados pessoais é:
            </p>
            <ul className="mt-3 space-y-1 pl-5 list-disc">
              <li>
                <strong>Nome fantasia:</strong> RevendaClick
              </li>
              <li>
                <strong>Endereço de contato:</strong>{' '}
                <a
                  href="mailto:contato@revendaclick.com.br"
                  className="text-red-600 underline hover:text-red-700"
                >
                  contato@revendaclick.com.br
                </a>
              </li>
            </ul>
            <p className="mt-3">
              O encarregado pelo tratamento de dados pessoais (DPO) pode ser contatado pelo
              mesmo endereço de e-mail acima.
            </p>
          </section>

          {/* 2. Dados coletados */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              2. Quais Dados Coletamos
            </h2>
            <p>Coletamos as seguintes categorias de dados:</p>

            <h3 className="mt-5 mb-2 text-base font-semibold text-gray-800">
              2.1 Dados fornecidos voluntariamente
            </h3>
            <ul className="pl-5 list-disc space-y-1">
              <li>Nome completo</li>
              <li>Número de telefone (WhatsApp)</li>
              <li>Endereço de e-mail</li>
              <li>Cidade e estado</li>
              <li>Quantidade aproximada de veículos no estoque</li>
            </ul>

            <h3 className="mt-5 mb-2 text-base font-semibold text-gray-800">
              2.2 Dados de navegação coletados automaticamente
            </h3>
            <ul className="pl-5 list-disc space-y-1">
              <li>Endereço IP</li>
              <li>Tipo de dispositivo, sistema operacional e navegador</li>
              <li>Páginas visitadas, tempo de permanência e interações</li>
              <li>Parâmetros UTM e origem do tráfego</li>
              <li>Identificadores de cookies e pixels de rastreamento</li>
            </ul>
          </section>

          {/* 3. Finalidade */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              3. Para Que Usamos Seus Dados
            </h2>
            <ul className="pl-5 list-disc space-y-2">
              <li>
                <strong>Demonstração comercial:</strong> entrar em contato com lojistas
                interessados no RevendaClick para agendar uma apresentação personalizada da
                plataforma.
              </li>
              <li>
                <strong>Contato via WhatsApp e telefone:</strong> comunicar novidades,
                enviar materiais relevantes e dar suporte ao processo de decisão de compra.
              </li>
              <li>
                <strong>Melhoria do produto:</strong> analisar o perfil dos interessados
                para aprimorar funcionalidades, comunicação e segmentação de campanhas.
              </li>
              <li>
                <strong>Análise de desempenho de marketing:</strong> mensurar o resultado de
                campanhas pagas e orgânicas por meio de ferramentas de analytics (ver seção 5).
              </li>
            </ul>
          </section>

          {/* 4. Base legal */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              4. Base Legal (LGPD)
            </h2>
            <p>
              O tratamento dos seus dados pessoais é fundamentado nas seguintes hipóteses
              previstas na Lei nº 13.709/2018 (LGPD):
            </p>
            <ul className="mt-3 pl-5 list-disc space-y-2">
              <li>
                <strong>Art. 7º, I — Consentimento:</strong> ao preencher nosso formulário
                de contato e marcar a caixa de consentimento, você autoriza expressamente o
                uso dos seus dados para as finalidades descritas nesta política.
              </li>
              <li>
                <strong>Art. 7º, VI — Legítimo interesse:</strong> utilizamos dados de
                navegação coletados automaticamente para análise de desempenho de campanhas
                e melhoria contínua do produto, respeitando seus direitos e expectativas
                razoáveis de privacidade.
              </li>
            </ul>
          </section>

          {/* 5. Cookies */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              5. Cookies e Tecnologias de Rastreamento
            </h2>
            <p>
              Utilizamos cookies e tecnologias similares para personalizar sua experiência,
              analisar o desempenho do site e medir a eficácia das nossas campanhas
              publicitárias. Os tipos de cookies utilizados são:
            </p>

            <h3 className="mt-5 mb-2 text-base font-semibold text-gray-800">
              5.1 Cookies funcionais
            </h3>
            <p>
              Necessários para o funcionamento básico do site, como manutenção de sessão
              autenticada. Não podem ser desativados sem comprometer a experiência.
            </p>

            <h3 className="mt-5 mb-2 text-base font-semibold text-gray-800">
              5.2 Cookies de analytics
            </h3>
            <p>
              Coletam dados anônimos sobre como os visitantes interagem com o site (páginas
              acessadas, duração da visita, origem do tráfego). Usamos o Google Analytics 4
              para esse fim.
            </p>

            <h3 className="mt-5 mb-2 text-base font-semibold text-gray-800">
              5.3 Cookies de publicidade
            </h3>
            <p>
              Utilizados para rastrear conversões de campanhas pagas e exibir anúncios
              relevantes em outras plataformas. Incluem os cookies do Meta Pixel (Facebook/
              Instagram) e TikTok Pixel.
            </p>
          </section>

          {/* 6. Analytics e pixels */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              6. Ferramentas de Analytics e Publicidade
            </h2>
            <p>
              Utilizamos as seguintes plataformas de terceiros para medir e otimizar o
              desempenho do nosso marketing:
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-800">Ferramenta</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-800">Finalidade</th>
                    <th className="border border-gray-200 px-4 py-2 text-left font-semibold text-gray-800">Política do Terceiro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Google Analytics 4</td>
                    <td className="border border-gray-200 px-4 py-2">Análise de comportamento de navegação e mensuração de tráfego</td>
                    <td className="border border-gray-200 px-4 py-2">
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-red-600 underline hover:text-red-700">
                        policies.google.com/privacy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">Meta Pixel (Facebook/Instagram)</td>
                    <td className="border border-gray-200 px-4 py-2">Rastreamento de conversões de campanhas pagas no Facebook e Instagram</td>
                    <td className="border border-gray-200 px-4 py-2">
                      <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-red-600 underline hover:text-red-700">
                        facebook.com/privacy/policy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-4 py-2">TikTok Pixel</td>
                    <td className="border border-gray-200 px-4 py-2">Rastreamento de conversões e otimização de campanhas no TikTok</td>
                    <td className="border border-gray-200 px-4 py-2">
                      <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-red-600 underline hover:text-red-700">
                        tiktok.com/legal/privacy-policy
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Retenção */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              7. Prazo de Retenção
            </h2>
            <ul className="pl-5 list-disc space-y-2">
              <li>
                <strong>Leads e dados de contato:</strong> mantidos por até 2 anos a contar
                da data do preenchimento do formulário, exceto se você solicitar exclusão
                anteriormente.
              </li>
              <li>
                <strong>Dados de clientes ativos (assinantes):</strong> mantidos durante
                toda a vigência do contrato e por até 5 anos após o encerramento, para
                cumprimento de obrigações legais e fiscais.
              </li>
              <li>
                <strong>Dados de analytics e cookies:</strong> conforme a política de
                retenção de cada plataforma (Google, Meta, TikTok), geralmente entre 14 e 26
                meses.
              </li>
            </ul>
          </section>

          {/* 8. Compartilhamento */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              8. Compartilhamento de Dados
            </h2>
            <p>
              Não vendemos nem alugamos seus dados pessoais. Compartilhamos apenas com
              processadores contratados para viabilizar nossos serviços, nas condições
              abaixo:
            </p>
            <ul className="mt-3 pl-5 list-disc space-y-2">
              <li>
                <strong>Supabase / AWS (USA):</strong> banco de dados e autenticação.
                Processador contratual com Cláusulas Contratuais Padrão (SCCs) aprovadas
                pela Comissão Europeia, aplicáveis equivalentemente para fins de proteção
                internacional de dados.
              </li>
              <li>
                <strong>Google LLC (USA):</strong> Google Analytics 4. Dados de navegação
                anonimizados. Sujeito à política de privacidade da Google.
              </li>
              <li>
                <strong>Meta Platforms, Inc. (USA):</strong> Meta Pixel para rastreamento
                de conversões de campanhas publicitárias. Dados de comportamento de
                navegação. Sujeito à política de privacidade da Meta.
              </li>
              <li>
                <strong>TikTok Inc. (USA/Singapura):</strong> TikTok Pixel para rastreamento
                de conversões. Sujeito à política de privacidade do TikTok.
              </li>
            </ul>
          </section>

          {/* 9. Direitos LGPD */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              9. Seus Direitos (LGPD — Art. 18)
            </h2>
            <p>
              Como titular de dados pessoais, você tem os seguintes direitos garantidos pela
              LGPD, que podem ser exercidos a qualquer momento:
            </p>
            <ul className="mt-3 pl-5 list-disc space-y-2">
              <li>
                <strong>Acesso:</strong> confirmar a existência de tratamento e obter cópia
                dos dados que temos sobre você.
              </li>
              <li>
                <strong>Correção:</strong> solicitar a atualização de dados incompletos,
                inexatos ou desatualizados.
              </li>
              <li>
                <strong>Exclusão:</strong> pedir a eliminação dos seus dados pessoais (ver
                seção 10).
              </li>
              <li>
                <strong>Portabilidade:</strong> receber seus dados em formato estruturado e
                legível por máquina.
              </li>
              <li>
                <strong>Oposição:</strong> se opor ao tratamento realizado com base em
                legítimo interesse.
              </li>
              <li>
                <strong>Revogação do consentimento:</strong> retirar o consentimento
                anteriormente dado a qualquer momento, sem prejuízo do tratamento já
                realizado.
              </li>
              <li>
                <strong>Informação:</strong> obter informações sobre as entidades públicas
                e privadas com quem compartilhamos seus dados.
              </li>
            </ul>
            <p className="mt-4">
              Para exercer qualquer desses direitos, entre em contato pelo e-mail{' '}
              <a
                href="mailto:contato@revendaclick.com.br"
                className="text-red-600 underline hover:text-red-700"
              >
                contato@revendaclick.com.br
              </a>{' '}
              ou pelo formulário disponível em{' '}
              <Link href="/contato" className="text-red-600 underline hover:text-red-700">
                revendaclick.com.br/contato
              </Link>
              . Responderemos em até 15 dias úteis.
            </p>
          </section>

          {/* 10. Exclusão */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              10. Como Solicitar a Exclusão dos Seus Dados
            </h2>
            <p>
              Para solicitar a exclusão de todos os seus dados pessoais, envie um e-mail
              para{' '}
              <a
                href="mailto:contato@revendaclick.com.br?subject=Exclus%C3%A3o%20de%20Dados"
                className="text-red-600 underline hover:text-red-700"
              >
                contato@revendaclick.com.br
              </a>{' '}
              com o assunto <strong>&quot;Exclusão de Dados&quot;</strong>. Inclua o número de
              telefone ou e-mail que você utilizou ao preencher nosso formulário para que
              possamos localizar e excluir seus dados corretamente.
            </p>
            <p className="mt-3">
              Processaremos sua solicitação em até 15 dias úteis. Podemos reter alguns dados
              pelo prazo mínimo exigido por lei (ex.: dados fiscais e contábeis) mesmo após
              a exclusão.
            </p>
          </section>

          {/* 11. Transferência internacional */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              11. Transferência Internacional de Dados
            </h2>
            <p>
              Seus dados podem ser transferidos e processados em servidores localizados
              nos Estados Unidos da América, onde estão hospedados nossos principais
              fornecedores (Supabase via Amazon Web Services, Google, Meta e TikTok).
            </p>
            <p className="mt-3">
              Essas transferências são realizadas com base em Cláusulas Contratuais Padrão
              (SCCs) ou mecanismos equivalentes que garantem nível de proteção adequado aos
              seus dados, em conformidade com o Art. 33 da LGPD.
            </p>
          </section>

          {/* 12. Alterações */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              12. Alterações nesta Política
            </h2>
            <p>
              Esta Política de Privacidade pode ser atualizada periodicamente para refletir
              mudanças em nossas práticas, na legislação aplicável ou nos serviços
              oferecidos. Sempre que houver alterações relevantes, atualizaremos a data de
              vigência no topo desta página.
            </p>
            <p className="mt-3">
              Para mudanças significativas que afetem o uso dos seus dados de forma
              material, notificaremos por e-mail (quando disponível) ou por aviso destacado
              em nosso site. Recomendamos que você revise esta política periodicamente.
            </p>
          </section>

          {/* 13. DPO */}
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              13. Encarregado de Dados (DPO)
            </h2>
            <p>
              Nosso Encarregado pelo Tratamento de Dados Pessoais (Data Protection Officer
              — DPO) está disponível para esclarecer dúvidas, receber solicitações de
              titulares e tratar comunicações relacionadas à privacidade e proteção de
              dados.
            </p>
            <p className="mt-3">
              <strong>Contato do DPO:</strong>{' '}
              <a
                href="mailto:contato@revendaclick.com.br"
                className="text-red-600 underline hover:text-red-700"
              >
                contato@revendaclick.com.br
              </a>
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 border-t border-gray-100 pt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  )
}
