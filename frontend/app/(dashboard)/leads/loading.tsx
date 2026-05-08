export default function LeadsLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-24 rounded-lg bg-gray-200" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-gray-200" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-48 rounded bg-gray-100" />
            </div>
            <div className="h-5 w-16 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
