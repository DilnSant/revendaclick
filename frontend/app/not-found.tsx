export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-6xl font-bold text-gray-200">404</h1>
      <h2 className="text-xl font-semibold text-gray-800">Página não encontrada</h2>
      <p className="max-w-sm text-gray-500">
        O endereço que você acessou não existe ou foi removido.
      </p>
      <a href="/" className="mt-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
        Voltar ao início
      </a>
    </div>
  )
}
