import { useTheme } from '../ThemeContext'
import { icons } from '../../lib/icons'

const SIZES = {
  sm: { box: 'w-8 h-8 rounded-xl', icon: 'w-4 h-4' },
  md: { box: 'w-10 h-10 rounded-2xl', icon: 'w-5 h-5' },
  lg: { box: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7' },
}

const COLOR_CLASSES = {
  emerald: { light: 'bg-emerald-100 text-emerald-600', dark: 'bg-emerald-500/20 text-emerald-400' },
  cyan: { light: 'bg-cyan-100 text-cyan-600', dark: 'bg-cyan-500/20 text-cyan-400' },
  violet: { light: 'bg-violet-100 text-violet-600', dark: 'bg-violet-500/20 text-violet-400' },
  orange: { light: 'bg-orange-100 text-orange-600', dark: 'bg-orange-500/20 text-orange-400' },
  pink: { light: 'bg-pink-100 text-pink-600', dark: 'bg-pink-500/20 text-pink-400' },
  red: { light: 'bg-red-100 text-red-600', dark: 'bg-red-500/20 text-red-400' },
  navy: { light: 'bg-navy-100 text-navy-500', dark: 'bg-white/[0.06] text-white/50' },
}

/** A small rounded, tinted box for an icon — the "icon chip" pattern used on
 * nearly every card header and stat tile across the app. `icon` accepts either
 * a lucide-react component or a string key into lib/icons.jsx. */
export default function IconChip({ icon, color = 'emerald', size = 'md', className = '' }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const Icon = typeof icon === 'string' ? icons[icon] : icon
  const { box, icon: iconSize } = SIZES[size] || SIZES.md
  const colorCls = COLOR_CLASSES[color] || COLOR_CLASSES.emerald
  return (
    <div className={`${box} flex items-center justify-center shrink-0 ${isLight ? colorCls.light : colorCls.dark} ${className}`}>
      {Icon && <Icon className={iconSize} />}
    </div>
  )
}
