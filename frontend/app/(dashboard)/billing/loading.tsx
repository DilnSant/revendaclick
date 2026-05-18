export default function BillingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-gray-200" />
          <div className="h-4 w-56 rounded bg-gray-100" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-gray-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="h-5 w-40 rounded bg-gray-200" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between border-b border-gray-100 pb-2">
              <div className="h-4 w-24 rounded bg-gray-100" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
          <div className="h-5 w-20 rounded bg-gray-200" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
