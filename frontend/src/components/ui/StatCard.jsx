import { motion } from 'framer-motion'
import { useTheme } from '../ThemeContext'
import IconChip from './IconChip'

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

/** A stat tile: icon chip top-left, uppercase label top-right, big value,
 * optional sub-line. Used across Analytics, Knowledge, and Reports for
 * "at a glance" metric grids. */
export default function StatCard({ label, value, sub, icon, color = 'emerald' }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  return (
    <motion.div
      variants={itemAnim}
      className={`p-5 transition-all duration-300 ${
        isLight ? 'bg-white rounded-3xl shadow-sm border border-navy-100 hover:shadow-md' : 'glass-card-hover'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <IconChip icon={icon} color={color} />
        <span className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{sub}</p>}
    </motion.div>
  )
}
