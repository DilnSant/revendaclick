export default function SalesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 rounded-lg bg-gray-200" />
        <div className="h-9 w-32 rounded-lg bg-gray-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-2">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-8 w-28 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-xl bg-gray-100" />
    </div>
  )
}
