export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-5 w-16" />
      </div>
      <div className="skeleton h-4 w-48" />
      <div className="flex justify-between">
        <div className="skeleton h-6 w-20" />
        <div className="skeleton h-6 w-24" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="border border-gray-800 rounded-xl p-4 bg-[#111118]">
      <div className="skeleton h-3 w-20 mb-2" />
      <div className="skeleton h-7 w-16 mb-1" />
      <div className="skeleton h-3 w-24" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-7 w-32 mb-2" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="skeleton h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="bg-[#111118] border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="skeleton h-5 w-24" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-6 w-6 rounded-full" />
            <div className="flex-1"><div className="skeleton h-4 w-full" /></div>
            <div className="skeleton h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-[#111118] border border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3"><div className="skeleton h-3 w-16" /></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
        </tbody>
      </table>
    </div>
  );
}
