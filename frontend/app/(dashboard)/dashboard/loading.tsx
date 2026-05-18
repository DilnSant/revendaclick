export default function DashboardPageLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <div className="h-7 w-36 rounded-lg bg-gray-200" />
        <div className="mt-1.5 h-4 w-48 rounded bg-gray-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="mt-3 h-8 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="mt-2 h-10 w-12 rounded bg-gray-200" />
            <div className="mt-3 h-2 w-full rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="h-5 w-48 rounded bg-gray-200" />
        <div className="mt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
