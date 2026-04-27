import { useState, useEffect } from 'react'
import { Music, Video, Image, Volume2, Search, Plus, Trash2, Play, Upload, Loader2 } from 'lucide-react'
import Button from './ui/Button'
import SongCreatorModal from './modals/SongCreatorModal'
import { api } from '../api/client'
import { useServiceStore } from '../store/useServiceStore'
import { useAppStore } from '../store/useAppStore'
import type { Song, MediaFile, MediaType } from '../types'

type Tab = 'songs' | 'images' | 'videos' | 'audio'

export default function MediaLibrary(): JSX.Element {
  const [tab, setTab] = useState<Tab>('songs')
  const [search, setSearch] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [media, setMedia] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSongCreator, setShowSongCreator] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)

  const { activePlan, addItem } = useServiceStore()
  const { addToast } = useAppStore()

  useEffect(() => {
    loadData()
  }, [tab])

  const loadData = async (): Promise<void> => {
    setIsLoading(true)
    try {
      if (tab === 'songs') {
        const data = await api.songs.list(search || undefined)
        setSongs(data)
      } else {
        const typeMap: Record<Tab, MediaType> = { images: 'image', videos: 'video', audio: 'audio', songs: 'image' }
        const data = await api.media.list(typeMap[tab])
        setMedia(data)
      }
    } catch {
      // backend not running — show empty state
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSongToService = async (song: Song): Promise<void> => {
    if (!activePlan) {
      addToast('Open a service plan first', 'warning')
      return
    }
    await addItem(activePlan.id, 'song', song.id)
    addToast(`"${song.title}" added to service`, 'success')
  }

  const handleDeleteSong = async (id: string): Promise<void> => {
    await api.songs.delete(id)
    setSongs((s) => s.filter((song) => song.id !== id))
    addToast('Song deleted', 'info')
  }

  const handleSongSaved = (song: Song): void => {
    setSongs((s) => {
      const idx = s.findIndex((x) => x.id === song.id)
      if (idx >= 0) {
        const next = [...s]
        next[idx] = song
        return next
      }
      return [song, ...s]
    })
    setShowSongCreator(false)
    setEditingSong(null)
  }

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    { id: 'songs', label: 'Songs', icon: <Music size={14} /> },
    { id: 'images', label: 'Images', icon: <Image size={14} /> },
    { id: 'videos', label: 'Videos', icon: <Video size={14} /> },
    { id: 'audio', label: 'Audio', icon: <Volume2 size={14} /> }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <h2 className="font-semibold text-slate-100">Media Library</h2>
        <div className="flex gap-2">
          {tab === 'songs' ? (
            <Button variant="primary" size="sm" onClick={() => setShowSongCreator(true)}>
              <Plus size={14} /> New Song
            </Button>
          ) : (
            <Button variant="secondary" size="sm">
              <Upload size={14} /> Upload
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-2 border-b border-slate-800 shrink-0">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === id
                ? 'bg-brand-600/20 text-brand-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            ].join(' ')}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-slate-800 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="input pl-8 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-slate-500" />
          </div>
        ) : tab === 'songs' ? (
          songs.length === 0 ? (
            <EmptyState
              icon={<Music size={32} />}
              message="No songs in your library"
              action="Create a song to get started"
            />
          ) : (
            <div className="space-y-1">
              {songs.map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  onAdd={() => handleAddSongToService(song)}
                  onEdit={() => {
                    setEditingSong(song)
                    setShowSongCreator(true)
                  }}
                  onDelete={() => handleDeleteSong(song.id)}
                />
              ))}
            </div>
          )
        ) : media.length === 0 ? (
          <EmptyState icon={<Upload size={32} />} message={`No ${tab} uploaded`} action="Upload files to get started" />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {media.map((file) => (
              <MediaCard
                key={file.id}
                file={file}
                onAdd={() => {
                  if (!activePlan) { addToast('Open a service plan first', 'warning'); return }
                  addItem(activePlan.id, 'media', file.id)
                  addToast(`"${file.title}" added to service`, 'success')
                }}
              />
            ))}
          </div>
        )}
      </div>

      <SongCreatorModal
        open={showSongCreator}
        onClose={() => { setShowSongCreator(false); setEditingSong(null) }}
        song={editingSong}
        onSaved={handleSongSaved}
      />
    </div>
  )
}

// ─── Song Row ─────────────────────────────────────────────────────────────────

function SongRow({
  song,
  onAdd,
  onEdit,
  onDelete
}: {
  song: Song
  onAdd: () => void
  onEdit: () => void
  onDelete: () => void
}): JSX.Element {
  const langColors: Record<string, string> = {
    en: 'bg-blue-900/30 text-blue-400',
    es: 'bg-green-900/30 text-green-400',
    pt: 'bg-yellow-900/30 text-yellow-400'
  }

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-violet-900/30 flex items-center justify-center shrink-0">
        <Music size={16} className="text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{song.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {song.artist && <span className="text-xs text-slate-500 truncate">{song.artist}</span>}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${langColors[song.language] ?? 'bg-slate-800 text-slate-400'}`}>
            {song.language.toUpperCase()}
          </span>
          {song.translations?.map((t) => (
            <span key={t.language} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${langColors[t.language] ?? 'bg-slate-800 text-slate-400'}`}>
              {t.language.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors" title="Edit">
          <Play size={13} />
        </button>
        <button onClick={onAdd} className="p-1.5 text-slate-500 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors" title="Add to service">
          <Plus size={13} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Media Card ───────────────────────────────────────────────────────────────

function MediaCard({ file, onAdd }: { file: MediaFile; onAdd: () => void }): JSX.Element {
  const typeIcon = file.type === 'video' ? <Video size={20} className="text-orange-400" /> : file.type === 'audio' ? <Volume2 size={20} className="text-pink-400" /> : <Image size={20} className="text-sky-400" />

  return (
    <div className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="aspect-video flex items-center justify-center bg-slate-800">
        {file.type === 'image' ? (
          <img src={`file://${file.filePath}`} alt={file.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="flex flex-col items-center gap-2">{typeIcon}<span className="text-[10px] text-slate-500">{file.type.toUpperCase()}</span></div>
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="text-xs font-medium text-slate-300 truncate">{file.title}</p>
      </div>
      <button onClick={onAdd} className="absolute top-2 right-2 bg-brand-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        <Plus size={12} />
      </button>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, message, action }: { icon: JSX.Element; message: string; action: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      <div className="text-slate-700">{icon}</div>
      <div>
        <p className="text-slate-400 font-medium text-sm">{message}</p>
        <p className="text-slate-600 text-xs mt-1">{action}</p>
      </div>
    </div>
  )
}
