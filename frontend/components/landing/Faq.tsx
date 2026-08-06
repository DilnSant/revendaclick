import { Section, SectionHead, Reveal } from './ui'

/** Fonte única das perguntas — reaproveitada no JSON-LD (FAQPage) em app/page.tsx. */
export const FAQ_ITENS = [
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. O RevendaClick roda inteiramente no navegador. Você acessa pelo computador da loja, pelo celular ou pelo tablet, sem instalar programa, contratar servidor ou depender de técnico.',
  },
  {
    q: 'Funciona bem no celular?',
    a: 'Sim. A plataforma foi feita para ser usada no balcão e no pátio, com o telefone na mão. Cadastrar veículo, responder interessado e consultar estoque funcionam igual no celular e no computador.',
  },
  {
    q: 'Consigo trazer meus veículos que já estão cadastrados em outro lugar?',
    a: 'Sim. Você cadastra os veículos pelo painel, com preenchimento assistido por dados FIPE para acelerar. Se o volume for grande, fale com a gente durante o teste que orientamos a melhor forma de subir seu estoque.',
  },
  {
    q: 'Como funciona o suporte?',
    a: 'Suporte por e-mail e WhatsApp para todos os planos, em português e com gente que entende de revenda. Durante o teste gratuito você tem o mesmo atendimento de quem já é assinante.',
  },
  {
    q: 'Preciso colocar cartão de crédito para testar?',
    a: 'Não. São 30 dias gratuitos sem cadastrar forma de pagamento. Você só informa dados de cobrança se decidir continuar depois do período de teste.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Pode, a qualquer momento, pelo próprio painel e sem multa ou fidelidade. A assinatura é mensal e você continua com acesso até o fim do período já pago.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Os dados da sua loja ficam isolados dos de qualquer outra revenda, com backup automático diário. Se você cancelar, os dados continuam sendo seus e podem ser exportados.',
  },
  {
    q: 'Minha loja é pequena. Vale a pena?',
    a: 'O plano Starter existe justamente para revendas menores. Se você já perde ao menos um negócio por mês por falta de acompanhamento, a conta costuma fechar — use a calculadora acima com os seus números.',
  },
]

export default function Faq() {
  return (
    <Section id="faq">
      <Reveal>
        <SectionHead eyebrow="Dúvidas" title="O que os lojistas perguntam antes de começar" />
      </Reveal>

      <div className="mx-auto mt-14 max-w-3xl divide-y divide-white/[0.07] border-y border-white/[0.07]">
        {FAQ_ITENS.map((item, i) => (
          <Reveal key={item.q} delay={i * 45}>
            <details className="group">
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-6 py-6 text-left transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
                <span className="font-heading text-base font-semibold text-white/90 sm:text-lg">
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.12] text-white/50 transition-all duration-300 group-open:rotate-45 group-open:border-primary/40 group-open:text-primary"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="pb-6 pr-14 text-sm leading-relaxed text-white/55">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
