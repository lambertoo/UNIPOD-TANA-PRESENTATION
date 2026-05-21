export function SkeletonCard() {
  return (
    <div className="rounded-xl border-l-4 border-border-subtle p-5 shadow-lg bg-surface animate-pulse">
      <div className="h-4 w-24 bg-surface-elevated rounded mb-3" />
      <div className="h-8 w-16 bg-surface-elevated rounded" />
    </div>
  );
}

export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr className="border-b border-border-subtle animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-surface-elevated rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-surface-elevated rounded animate-pulse w-full" style={{ width: i === lines - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}
