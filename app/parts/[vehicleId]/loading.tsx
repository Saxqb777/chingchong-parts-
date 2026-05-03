export default function PartsLoading() {
  return (
    <div className="min-h-screen bg-paper animate-pulse">
      {/* Banner skeleton */}
      <div className="border-b border-paper-edge px-12 py-8 bg-paper-deep flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-paper-edge rounded" />
          <div className="h-7 w-64 bg-paper-edge rounded" />
          <div className="h-3 w-48 bg-paper-edge rounded" />
        </div>
        <div className="h-8 w-20 bg-paper-edge rounded" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '200px 1fr' }}>
        {/* Category sidebar skeleton */}
        <div className="border-r border-paper-edge px-5 py-6 space-y-3 bg-paper-deep">
          <div className="h-2 w-16 bg-paper-edge rounded mb-5" />
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-7 w-full bg-paper-edge rounded" />
          ))}
        </div>

        {/* Parts table skeleton */}
        <div className="px-10 py-6">
          {/* Search bar skeleton */}
          <div className="h-10 w-full bg-paper-edge rounded mb-6" />

          {/* Table header */}
          <div className="flex gap-4 pb-3 border-b border-paper-edge mb-1">
            {[140, 80, 100, 80, 60].map((w, i) => (
              <div key={i} className={`h-2 bg-paper-edge rounded`} style={{ width: w }} />
            ))}
          </div>

          {/* Table rows */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="flex gap-4 py-4 border-b border-paper-edge items-center">
              <div className="h-3 bg-paper-edge rounded" style={{ width: 140 + (i % 3) * 20 }} />
              <div className="h-3 bg-paper-edge rounded" style={{ width: 80 }} />
              <div className="h-3 bg-paper-edge rounded" style={{ width: 100 }} />
              <div className="h-3 bg-paper-edge rounded" style={{ width: 70 }} />
              <div className="h-6 w-14 bg-paper-edge rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
