'use client'

import { useState } from 'react'

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  const toggle = (i: number) => setOpen((prev) => (prev === i ? null : i))

  return (
    <section className="bg-gray-50 py-24" id="faq" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2
            id="faq-heading"
            className="font-heading text-3xl font-bold text-graphite sm:text-4xl"
          >
            Perguntas frequentes.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Ainda tem dúvidas? Confira as respostas para as perguntas mais
            comuns.
          </p>
        </div>

        <div className="mt-12 space-y-3" role="list">
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${
                  isOpen ? 'border-primary/30 shadow-card-hover' : 'border-gray-100 shadow-card'
                }`}
                role="listitem"
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-heading text-sm font-bold text-graphite sm:text-base">
                    {faq.question}
                  </span>
                  <span
                    className={`ml-4 shrink-0 rounded-lg p-1 transition-all duration-200 ${
                      isOpen ? 'bg-primary/10 rotate-45' : 'bg-gray-100'
                    }`}
                    aria-hidden
                  >
                    <svg
                      className={`h-4 w-4 transition-colors ${
                        isOpen ? 'text-primary' : 'text-gray-500'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>

                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-64' : 'max-h-0'
                  }`}
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed text-gray-500">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

const FAQS = [
  {
    question: 'O RevendaClick funciona para qualquer loja?',
    answer:
      'Sim! O RevendaClick foi desenvolvido para revendas de veículos de qualquer porte — desde lojas com 10 veículos até grandes revendedoras com centenas de itens no estoque. O sistema se adapta ao tamanho e às necessidades da sua operação.',
  },
  {
    question: 'Preciso instalar algo?',
    answer:
      'Não! O RevendaClick funciona 100% na web. Basta acessar pelo computador, celular ou tablet — qualquer navegador moderno funciona. Nenhuma instalação, nenhum servidor próprio, nenhuma configuração técnica necessária.',
  },
  {
    question: 'Posso divulgar em redes sociais?',
    answer:
      'Sim! Você pode compartilhar seus veículos diretamente no Instagram, Facebook, TikTok e qualquer outra rede social com um clique. Cada veículo tem sua própria página pública com URL para divulgação em qualquer canal.',
  },
  {
    question: 'Consigo compartilhar pelo WhatsApp?',
    answer:
      'Com certeza! Cada veículo cadastrado tem um link individual que você pode copiar e enviar para qualquer contato pelo WhatsApp, Telegram ou qualquer aplicativo de mensagens. O link abre uma página elegante com todas as informações e fotos do veículo.',
  },
  {
    question: 'Como funciona o suporte?',
    answer:
      'Oferecemos suporte por e-mail e WhatsApp para todos os planos. Os planos Pro e Enterprise têm atendimento prioritário com tempo de resposta reduzido. O plano Enterprise inclui um gerente de sucesso dedicado para acompanhar sua operação.',
  },
  {
    question: 'Posso testar antes de assinar?',
    answer:
      'Sim! Todos os planos incluem 30 dias grátis, sem necessidade de cartão de crédito. Você configura sua loja, cadastra seus veículos e testa todas as funcionalidades sem nenhum compromisso. Só começa a pagar se decidir continuar.',
  },
]
