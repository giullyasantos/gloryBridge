import { useState } from 'react'
import { Search, BookOpen, Plus, Star, Loader2 } from 'lucide-react'
import Button from './ui/Button'
import { api } from '../api/client'
import { useServiceStore } from '../store/useServiceStore'
import { useAppStore } from '../store/useAppStore'
import type { Scripture, BibleVersion } from '../types'
import { BIBLE_VERSIONS } from '../types'

const TOPIC_CATEGORIES = [
  { label: 'Love', query: 'love' },
  { label: 'Peace', query: 'peace' },
  { label: 'Hope', query: 'hope' },
  { label: 'Salvation', query: 'salvation' },
  { label: 'Worship', query: 'worship' },
  { label: 'Prayer', query: 'prayer' },
  { label: 'Faith', query: 'faith' },
  { label: 'Grace', query: 'grace' }
]

const POPULAR_VERSES = [
  'John 3:16',
  'Psalm 23:1',
  'Romans 8:28',
  'Philippians 4:13',
  'Jeremiah 29:11',
  'Isaiah 41:10',
  'Proverbs 3:5',
  'Matthew 6:33'
]

export default function ScriptureSearch(): JSX.Element {
  const [query, setQuery] = useState('')
  const [version, setVersion] = useState<BibleVersion>('NIV')
  const [results, setResults] = useState<Scripture[]>([])
  const [saved, setSaved] = useState<Scripture[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search')

  const { activePlan, addItem } = useServiceStore()
  const { addToast } = useAppStore()

  const handleSearch = async (q?: string): Promise<void> => {
    const searchQuery = q ?? query
    if (!searchQuery.trim()) return
    setIsLoading(true)
    try {
      const data = await api.scriptures.search(searchQuery, version)
      setResults(data)
    } catch {
      // Show mock result when backend offline
      setResults([
        {
          id: 'mock-1',
          reference: searchQuery,
          book: searchQuery.split(' ')[0],
          chapter: 1,
          verseStart: 1,
          version,
          text: 'Connect to the backend to fetch scripture content.',
          language: 'en',
          createdAt: new Date().toISOString()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (scripture: Scripture): Promise<void> => {
    try {
      const saved = await api.scriptures.save(scripture)
      setSaved((s) => [saved, ...s])
      addToast('Scripture saved to library', 'success')
    } catch {
      addToast('Failed to save scripture', 'error')
    }
  }

  const handleAddToService = async (scripture: Scripture): Promise<void> => {
    if (!activePlan) {
      addToast('Open a service plan first', 'warning')
      return
    }
    await addItem(activePlan.id, 'scripture', scripture.id)
    addToast(`${scripture.reference} added to service`, 'success')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <h2 className="font-semibold text-slate-100">Scripture</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-2 border-b border-slate-800 shrink-0">
        {(['search', 'saved'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
              activeTab === t
                ? 'bg-brand-600/20 text-brand-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'search' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Search controls */}
          <div className="px-4 py-3 border-b border-slate-800 space-y-2 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="John 3:16 or keyword..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input pl-8 text-sm"
                />
              </div>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value as BibleVersion)}
                className="input w-24 text-sm"
              >
                {BIBLE_VERSIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <Button variant="primary" size="sm" fullWidth onClick={() => handleSearch()}>
              <Search size={13} /> Search
            </Button>
          </div>

          {/* Popular verses */}
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Popular Verses
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_VERSES.map((ref) => (
                <button
                  key={ref}
                  onClick={() => { setQuery(ref); handleSearch(ref) }}
                  className="text-xs text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
                >
                  {ref}
                </button>
              ))}
            </div>
          </div>

          {/* Topic categories */}
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Topics
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TOPIC_CATEGORIES.map(({ label, query: q }) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); handleSearch(q) }}
                  className="text-xs text-slate-400 hover:text-brand-400 bg-slate-800 hover:bg-brand-900/20 px-2 py-1 rounded-lg transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 size={20} className="animate-spin text-slate-500" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                <BookOpen size={28} className="text-slate-700" />
                <p className="text-slate-500 text-sm">Search for a verse or passage</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((scripture) => (
                  <ScriptureCard
                    key={scripture.id}
                    scripture={scripture}
                    onSave={() => handleSave(scripture)}
                    onAdd={() => handleAddToService(scripture)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3">
          {saved.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <Star size={28} className="text-slate-700" />
              <p className="text-slate-500 text-sm">No saved scriptures yet</p>
              <p className="text-slate-600 text-xs">Save verses from search results</p>
            </div>
          ) : (
            <div className="space-y-2">
              {saved.map((scripture) => (
                <ScriptureCard
                  key={scripture.id}
                  scripture={scripture}
                  onAdd={() => handleAddToService(scripture)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Scripture Card ───────────────────────────────────────────────────────────

function ScriptureCard({
  scripture,
  onSave,
  onAdd
}: {
  scripture: Scripture
  onSave?: () => void
  onAdd: () => void
}): JSX.Element {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 hover:border-slate-600 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-sm font-semibold text-blue-400">{scripture.reference}</span>
          <span className="text-xs text-slate-500 ml-2">{scripture.version}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onSave && (
            <button
              onClick={onSave}
              className="p-1.5 text-slate-600 hover:text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-colors"
              title="Save to library"
            >
              <Star size={13} />
            </button>
          )}
          <button
            onClick={onAdd}
            className="p-1.5 text-slate-600 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
            title="Add to service"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">{scripture.text}</p>
    </div>
  )
}
