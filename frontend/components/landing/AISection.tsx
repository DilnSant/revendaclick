import { Section, Reveal, Eyebrow, Heading, Lead, Glow, IconSpark } from './ui'

const CAPACIDADES = [
  {
    titulo: 'Sugere a resposta certa',
    texto:
      'A IA lê o contexto da conversa e propõe a próxima mensagem. Você revisa e envia — em segundos, não em meia hora.',
  },
  {
    titulo: 'Resgata negociação parada',
    texto:
      'Identifica clientes que esfriaram e traz de volta para o topo da fila, antes de virar venda do concorrente.',
  },
  {
    titulo: 'Classifica o interesse',
    texto:
      'Separa quem está pesquisando de quem está pronto para fechar, para a equipe atacar primeiro o que dá retorno.',
  },
  {
    titulo: 'Devolve seu tempo',
    texto:
      'O trabalho repetitivo de triagem sai da sua mão. Sobra energia para negociar, que é onde você ganha dinheiro.',
  },
]

export default function AISection() {
  return (
    <Section className="overflow-hidden">
      <Glow className="right-0 top-10 h-[420px] w-[520px] bg-indigo-500/[0.14]" />
      <Glow className="-left-20 bottom-0 h-[320px] w-[420px] bg-primary/[0.12]" />

      <div className="relative grid items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <div>
            <Eyebrow>Inteligência artificial</Eyebrow>
            <Heading className="mt-5">
              Um vendedor que <span className="text-primary">nunca esquece</span> de dar retorno
            </Heading>
            <Lead className="mt-6">
              A IA do RevendaClick não substitui seu time. Ela cobre o ponto onde a venda mais
              escapa: o intervalo entre o cliente perguntar e alguém responder.
            </Lead>

            <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-sm leading-relaxed text-white/55">
                Disponível nos planos Premium e como recurso adicional. Você ativa quando fizer
                sentido para o tamanho da sua operação.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAPACIDADES.map((c) => (
              <div
                key={c.titulo}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all duration-300 hover:border-primary/25 hover:bg-white/[0.055]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <IconSpark className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold text-white">
                  {c.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{c.texto}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
