export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <h2 className="text-xl font-semibold text-gray-800">Loja não encontrada</h2>
      <p className="max-w-sm text-gray-500">
        O endereço que você acessou não existe ou foi desativado.
      </p>
      <a href="/" className="btn-primary mt-2">
        Voltar ao início
      </a>
    </div>
  )
}
