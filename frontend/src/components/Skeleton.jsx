import { useTheme } from './ThemeContext'

export default function Skeleton({ className = '' }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  return <div className={`animate-pulse rounded-2xl ${isLight ? 'bg-navy-100' : 'bg-white/[0.06]'} ${className}`} />
}

export function SkeletonCard() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  return (
    <div className={`rounded-3xl p-5 space-y-3 ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
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
  const { theme } = useTheme()
  const isLight = theme === 'light'
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isLight ? 'bg-navy-100' : 'bg-white/[0.06]'}`}>
          <Icon className={`w-7 h-7 ${isLight ? 'text-navy-400' : 'text-white/30'}`} />
        </div>
      )}
      <p className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white/80'}`}>{title}</p>
      {description && <p className={`text-xs mt-1 max-w-sm ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
