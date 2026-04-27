import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, GripVertical, Sparkles, Loader2, Eye, Palette } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { api } from '../../api/client'
import { useAppStore } from '../../store/useAppStore'
import type { Song, SongSlide, SlideType, SongStyle } from '../../types'

type LocalSlide = Omit<SongSlide, 'id' | 'songId'> & { _key: string }

interface SongCreatorModalProps {
  open: boolean
  onClose: () => void
  song?: Song | null
  onSaved: (song: Song) => void
}

type Tab = 'lyrics' | 'style' | 'preview'

const SLIDE_TYPES: { value: SlideType; label: string; color: string }[] = [
  { value: 'intro', label: 'Intro', color: 'text-slate-400' },
  { value: 'verse', label: 'Verse', color: 'text-blue-400' },
  { value: 'pre-chorus', label: 'Pre-Chorus', color: 'text-cyan-400' },
  { value: 'chorus', label: 'Chorus', color: 'text-violet-400' },
  { value: 'bridge', label: 'Bridge', color: 'text-orange-400' },
  { value: 'outro', label: 'Outro', color: 'text-slate-400' }
]

const DEFAULT_STYLE: Omit<SongStyle, 'id'> = {
  backgroundColor: '#000000',
  fontFamily: 'Inter',
  fontSize: 48,
  fontColor: '#FFFFFF',
  textAlign: 'center',
  fontWeight: 'normal',
  textShadow: true,
  shadowColor: '#000000',
  lineHeight: 1.4,
  letterSpacing: 0
}

export default function SongCreatorModal({
  open,
  onClose,
  song,
  onSaved
}: SongCreatorModalProps): JSX.Element {
  const [tab, setTab] = useState<Tab>('lyrics')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [language, setLanguage] = useState('en')
  const [slides, setSlides] = useState<LocalSlide[]>([
    { type: 'verse', label: 'Verse 1', content: '', order: 0, _key: '1' }
  ])
  const [style, setStyle] = useState(DEFAULT_STYLE)
  const [isSaving, setIsSaving] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0)
  const { addToast } = useAppStore()
  const keyCounter = useRef(1)
  const nextKey = (): string => String(++keyCounter.current)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (song) {
      setTitle(song.title)
      setArtist(song.artist ?? '')
      setLanguage(song.language)
      setSlides(
        song.slides.map((s) => ({
          type: s.type,
          label: s.label,
          content: s.content,
          order: s.order,
          _key: nextKey()
        }))
      )
      if (song.style) {
        const { id, songId, ...styleData } = song.style
        setStyle(styleData)
      }
    } else {
      resetForm()
    }
    setTab('lyrics')
  }, [song, open])

  const resetForm = (): void => {
    setTitle('')
    setArtist('')
    setLanguage('en')
    setSlides([{ type: 'verse', label: 'Verse 1', content: '', order: 0, _key: nextKey() }])
    setStyle(DEFAULT_STYLE)
  }

  const addSlide = (): void => {
    setSlides((prev) => {
      const counts: Record<SlideType, number> = { intro: 0, verse: 0, 'pre-chorus': 0, chorus: 0, bridge: 0, outro: 0 }
      prev.forEach((s) => counts[s.type]++)
      const type: SlideType = 'verse'
      const label = `Verse ${counts.verse + 1}`
      return [...prev, { type, label, content: '', order: prev.length, _key: nextKey() }]
    })
  }

  const removeSlide = (key: string): void => {
    setSlides((prev) => prev.filter((s) => s._key !== key).map((s, i) => ({ ...s, order: i })))
  }

  const updateSlide = (key: string, updates: Partial<Omit<LocalSlide, '_key'>>): void => {
    setSlides((prev) => prev.map((s) => s._key === key ? { ...s, ...updates } : s))
  }

  const handleSlideDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSlides((prev) => {
      const oldIndex = prev.findIndex((s) => s._key === active.id)
      const newIndex = prev.findIndex((s) => s._key === over.id)
      return arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }))
    })
  }

  const handleAITranslate = async (targetLang: string): Promise<void> => {
    if (!song?.id) {
      addToast('Save the song first to translate', 'warning')
      return
    }
    setIsTranslating(true)
    try {
      await api.songs.translate(song.id, targetLang)
      addToast(`Translation to ${targetLang.toUpperCase()} in progress`, 'success')
    } catch {
      addToast('Translation failed — check AI API key in Settings', 'error')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) {
      addToast('Song title is required', 'warning')
      return
    }
    setIsSaving(true)
    try {
      const cleanSlides = slides.map(({ _key, ...rest }) => rest)
      const payload = { title, artist: artist || undefined, language, slides: cleanSlides, style }
      let saved: Song
      if (song?.id) {
        saved = await api.songs.update(song.id, payload)
      } else {
        saved = await api.songs.create(payload)
      }
      addToast(`"${saved.title}" saved`, 'success')
      onSaved(saved)
    } catch {
      addToast('Failed to save (backend offline)', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const currentPreviewSlide = slides[previewSlideIndex]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={song ? `Edit: ${song.title}` : 'New Song'}
      maxWidth="3xl"
    >
      {/* Tabs */}
      <div className="flex gap-1 px-6 py-3 border-b border-slate-800">
        {(['lyrics', 'style', 'preview'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              tab === t
                ? 'bg-brand-600/20 text-brand-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            ].join(' ')}
          >
            {t === 'style' && <Palette size={13} className="inline mr-1" />}
            {t === 'preview' && <Eye size={13} className="inline mr-1" />}
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Lyrics */}
      {tab === 'lyrics' && (
        <div className="p-6 space-y-4">
          {/* Song metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Title *</label>
              <input
                type="text"
                placeholder="Amazing Grace"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Artist</label>
              <input
                type="text"
                placeholder="John Newton"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>

            {/* AI Translate */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">AI Translate</label>
              <div className="flex gap-1">
                {(['es', 'pt'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleAITranslate(lang)}
                    disabled={isTranslating || language === lang}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-brand-900/30 text-slate-400 hover:text-brand-400 text-xs border border-slate-700 hover:border-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={`Translate to ${lang.toUpperCase()} using AI`}
                  >
                    {isTranslating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slides */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400">Slides</label>
              <span className="text-xs text-slate-600">{slides.length} slides</span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSlideDragEnd}
            >
              <SortableContext
                items={slides.map((s) => s._key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {slides.map((slide, index) => (
                    <SlideEditor
                      key={slide._key}
                      slideKey={slide._key}
                      slide={slide}
                      allSlides={slides}
                      onUpdate={(updates) => updateSlide(slide._key, updates)}
                      onRemove={() => removeSlide(slide._key)}
                      onFocus={() => setPreviewSlideIndex(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              onClick={addSlide}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500 hover:bg-slate-800/50 transition-colors text-sm"
            >
              <Plus size={14} /> Add Section
            </button>
          </div>
        </div>
      )}

      {/* Tab: Style */}
      {tab === 'style' && (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StyleField label="Background Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.backgroundColor}
                  onChange={(e) => setStyle((s) => ({ ...s, backgroundColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={style.backgroundColor}
                  onChange={(e) => setStyle((s) => ({ ...s, backgroundColor: e.target.value }))}
                  className="input flex-1 font-mono text-sm"
                />
              </div>
            </StyleField>

            <StyleField label="Font Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.fontColor}
                  onChange={(e) => setStyle((s) => ({ ...s, fontColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={style.fontColor}
                  onChange={(e) => setStyle((s) => ({ ...s, fontColor: e.target.value }))}
                  className="input flex-1 font-mono text-sm"
                />
              </div>
            </StyleField>

            <StyleField label="Font Family">
              <select
                value={style.fontFamily}
                onChange={(e) => setStyle((s) => ({ ...s, fontFamily: e.target.value }))}
                className="input"
              >
                {['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Helvetica', 'Playfair Display', 'Cinzel'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </StyleField>

            <StyleField label={`Font Size: ${style.fontSize}px`}>
              <input
                type="range"
                min={24}
                max={96}
                step={4}
                value={style.fontSize}
                onChange={(e) => setStyle((s) => ({ ...s, fontSize: Number(e.target.value) }))}
                className="w-full accent-brand-500"
              />
            </StyleField>

            <StyleField label="Text Align">
              <div className="flex gap-1">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => setStyle((s) => ({ ...s, textAlign: align }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors border ${style.textAlign === align ? 'bg-brand-600/20 text-brand-400 border-brand-700' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'}`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </StyleField>

            <StyleField label="Font Weight">
              <div className="flex gap-1">
                {(['normal', 'bold'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setStyle((s) => ({ ...s, fontWeight: w }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors border ${style.fontWeight === w ? 'bg-brand-600/20 text-brand-400 border-brand-700' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </StyleField>

            <StyleField label={`Line Height: ${style.lineHeight}`}>
              <input
                type="range"
                min={1.0}
                max={2.0}
                step={0.1}
                value={style.lineHeight}
                onChange={(e) => setStyle((s) => ({ ...s, lineHeight: Number(e.target.value) }))}
                className="w-full accent-brand-500"
              />
            </StyleField>

            <StyleField label="Text Shadow">
              <button
                onClick={() => setStyle((s) => ({ ...s, textShadow: !s.textShadow }))}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors border ${style.textShadow ? 'bg-brand-600/20 text-brand-400 border-brand-700' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'}`}
              >
                {style.textShadow ? 'Shadow On' : 'Shadow Off'}
              </button>
            </StyleField>
          </div>
        </div>
      )}

      {/* Tab: Preview */}
      {tab === 'preview' && (
        <div className="p-6">
          {/* Mini preview */}
          <div
            className="aspect-video w-full rounded-xl flex items-center justify-center overflow-hidden relative"
            style={{
              backgroundColor: style.backgroundColor,
              backgroundImage: style.backgroundImage ? `url(${style.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {currentPreviewSlide && (
              <p
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: `${Math.round(style.fontSize * 0.4)}px`,
                  color: style.fontColor,
                  textAlign: style.textAlign,
                  fontWeight: style.fontWeight,
                  lineHeight: style.lineHeight,
                  letterSpacing: `${style.letterSpacing}em`,
                  textShadow: style.textShadow
                    ? `2px 2px 8px ${style.shadowColor}88`
                    : 'none',
                  maxWidth: '80%',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {currentPreviewSlide.content || '(Empty slide)'}
              </p>
            )}

            {/* Slide label overlay */}
            {currentPreviewSlide && (
              <div className="absolute top-2 left-3 text-[10px] font-semibold text-white/40">
                {currentPreviewSlide.label}
              </div>
            )}
          </div>

          {/* Slide selector */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => setPreviewSlideIndex(i)}
                className={`px-2 py-1 rounded text-xs transition-colors ${i === previewSlideIndex ? 'bg-brand-600/20 text-brand-400' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
              >
                {slide.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
          {song ? 'Save Changes' : 'Create Song'}
        </Button>
      </div>
    </Modal>
  )
}

// ─── Slide Editor (sortable) ──────────────────────────────────────────────────

function SlideEditor({
  slideKey,
  slide,
  allSlides,
  onUpdate,
  onRemove,
  onFocus
}: {
  slideKey: string
  slide: LocalSlide
  allSlides: LocalSlide[]
  onUpdate: (updates: Partial<Omit<LocalSlide, '_key'>>) => void
  onRemove: () => void
  onFocus: () => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slideKey
  })
  const typeCfg = SLIDE_TYPES.find((t) => t.value === slide.type) ?? SLIDE_TYPES[1]

  const handleTypeChange = (type: SlideType): void => {
    const count = allSlides.filter((s) => s.type === type && s._key !== slideKey).length + 1
    const typeLabel = SLIDE_TYPES.find((t) => t.value === type)?.label ?? type
    onUpdate({ type, label: count === 1 ? typeLabel : `${typeLabel} ${count}` })
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden group"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border-b border-slate-700">
        <button
          className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <select
          value={slide.type}
          onChange={(e) => handleTypeChange(e.target.value as SlideType)}
          className="bg-transparent text-xs font-semibold border-none outline-none cursor-pointer"
          style={{ color: typeCfg.color.replace('text-', '') }}
        >
          {SLIDE_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          type="text"
          value={slide.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="flex-1 bg-transparent text-xs text-slate-400 border-none outline-none"
          placeholder="Slide label"
        />
        <button
          onClick={onRemove}
          className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <textarea
        value={slide.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        onFocus={onFocus}
        placeholder="Type lyrics here..."
        rows={3}
        className="w-full bg-transparent px-3 py-2 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none"
      />
    </div>
  )
}

// ─── Style Field ──────────────────────────────────────────────────────────────

function StyleField({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
