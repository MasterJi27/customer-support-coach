import { useTheme } from '../ThemeContext'
import IconChip from './IconChip'

/** A card with a small icon-chip + title header, and arbitrary children below.
 * The most repeated card shape in the app — dashboards, panels, and list
 * wrappers all use this same "icon + title + content" structure. */
export default function SectionCard({ icon, color = 'emerald', title, action, children, className = '' }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  return (
    <div className={`p-5 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <IconChip icon={icon} color={color} size="sm" />
          <p className={`text-sm font-semibold truncate ${isLight ? 'text-navy-800' : 'text-white'}`}>{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
