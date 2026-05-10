export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-32 rounded-lg bg-gray-200" />
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-100" />
          </div>
        ))}
        <div className="h-10 w-28 rounded-lg bg-gray-200" />
      </div>
    </div>
  )
}
