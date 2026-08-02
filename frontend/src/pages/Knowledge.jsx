import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, BookOpen, FilePlus2, Upload, Layers, FileText, Sparkles, ChevronDown } from 'lucide-react'
import { useTheme } from '../components/ThemeContext'
import { kbDocuments as sampleKbDocuments } from '../data'
import api from '../lib/api'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
}

function DocCard({ doc, index }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const pending = doc.status === 'Pending Review'
  return (
    <motion.div
      variants={itemAnim}
      className={`p-5 rounded-3xl transition-all duration-300 ${
        isLight ? 'bg-white border border-navy-100 shadow-sm hover:shadow-md' : 'glass-card-hover'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
          isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400'
        }`}>
          <FileText className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${
          pending
            ? isLight ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
            : isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
        }`}>
          {doc.status}
        </span>
      </div>
      <h3 className={`text-sm font-semibold ${isLight ? 'text-navy-800' : 'text-white'}`}>{doc.title}</h3>
      <p className={`text-xs mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>{doc.category}</p>
      <p className={`text-xs mt-3 leading-relaxed line-clamp-3 ${isLight ? 'text-navy-500' : 'text-white/50'}`}>{doc.content}</p>
      <div className="flex flex-wrap gap-1.5 mt-4">
        {doc.keywords.map(kw => (
          <span key={kw} className={`text-[10px] px-2 py-0.5 rounded-full ${
            isLight ? 'bg-navy-100 text-navy-500' : 'bg-white/[0.06] text-white/40'
          }`}>
            {kw}
          </span>
        ))}
      </div>
      {pending && (
        <div className="flex items-center gap-2 mt-4">
          <button className={`flex-1 text-xs font-medium px-3 py-2 rounded-xl transition-colors ${
            isLight ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}>
            Approve
          </button>
          <button className={`flex-1 text-xs font-medium px-3 py-2 rounded-xl transition-colors ${
            isLight ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
          }`}>
            Reject
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default function Knowledge() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [docs, setDocs] = useState(sampleKbDocuments)

  useEffect(() => {
    let mounted = true
    api.knowledge().then((res) => {
      if (!mounted || !res.documents?.length) return
      const live = res.documents.map((d, i) => ({
        id: d._file || `KB-${i}`,
        title: d.title || d.faq || d.question || d._file.replace('.json', '').replace('faq_', '').replace(/_/g, ' '),
        category: d.category || 'Live',
        status: d.status || 'Active',
        content: d.answer || d.content || d.solution || JSON.stringify(d).slice(0, 300),
        keywords: d.keywords || [d.category || 'support'].filter(Boolean),
        lastUpdated: d.updated_at || new Date().toISOString().slice(0, 10),
      }))
      setDocs(live)
    }).catch(() => { /* keep sample */ })
    return () => { mounted = false }
  }, [])

  const categories = ['All', ...new Set(docs.map(d => d.category))]
  const filtered = docs.filter(d => {
    const matchesCat = category === 'All' || d.category === category
    const matchesQuery = !query.trim() ||
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.content.toLowerCase().includes(query.toLowerCase()) ||
      (d.keywords || []).some(k => k.toLowerCase().includes(query.toLowerCase()))
    return matchesCat && matchesQuery
  })

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>Knowledge Base</h1>
          <p className={`text-sm mt-0.5 ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
            RAG console â€” the articles your coaching agents recommend
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary !px-4 !py-2.5 text-xs">
            <Upload className="w-3.5 h-3.5" /> Upload Doc
          </button>
          <button className="btn-primary !px-4 !py-2.5 text-xs">
            <FilePlus2 className="w-3.5 h-3.5" /> New Article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Indexed documents', value: `${docs.length + 12}`, icon: Layers, color: 'emerald' },
          { label: 'Active articles', value: docs.filter(d => d.status === 'Active').length.toString(), icon: BookOpen, color: 'cyan' },
          { label: 'Pending approvals', value: docs.filter(d => d.status === 'Pending Review').length.toString(), icon: Sparkles, color: 'orange' },
          { label: 'Chunks stored', value: '1,208', icon: FileText, color: 'violet' },
        ].map((stat, i) => {
          const colorCls = isLight
            ? ['bg-emerald-100 text-emerald-600', 'bg-cyan-100 text-cyan-600', 'bg-orange-100 text-orange-600', 'bg-violet-100 text-violet-600'][i]
            : ['bg-emerald-500/20 text-emerald-400', 'bg-cyan-500/20 text-cyan-400', 'bg-orange-500/20 text-orange-400', 'bg-violet-500/20 text-violet-400'][i]
          return (
            <motion.div key={stat.label} variants={itemAnim} className={`p-5 rounded-3xl ${
              isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorCls}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-navy-400' : 'text-white/30'}`}>{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${isLight ? 'text-navy-800' : 'text-white'}`}>{stat.value}</p>
            </motion.div>
          )
        })}
      </div>

      <motion.div variants={itemAnim} className={`p-5 rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-navy-300' : 'text-white/30'}`} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles by title, content, or keywordâ€¦"
              className={`glass-input pl-11 ${isLight ? '!bg-white' : ''}`}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs font-medium px-3.5 py-2 rounded-xl transition-all ${
                  category === cat
                    ? isLight
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isLight
                      ? 'bg-navy-50 text-navy-500 border border-navy-200 hover:bg-navy-100'
                      : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div variants={itemAnim} className={`p-10 text-center rounded-3xl ${isLight ? 'bg-white border border-navy-100 shadow-sm' : 'glass-card'}`}>
          <p className={`text-sm ${isLight ? 'text-navy-400' : 'text-white/40'}`}>
            No articles match "{query}" â€” try a different keyword, or draft a new FAQ.
          </p>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc, i) => (
            <DocCard key={doc.id} doc={doc} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
