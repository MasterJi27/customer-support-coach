export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.06] ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-white/[0.06] glass-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function EmptyState({ icon: Icon = null, title, description, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-white/30" />
        </div>
      )}
      <p className="text-sm font-semibold text-white/80">{title}</p>
      {description && <p className="text-xs text-white/40 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
