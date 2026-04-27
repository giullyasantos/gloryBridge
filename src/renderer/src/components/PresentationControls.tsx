import { ChevronLeft, ChevronRight, Square, Image as ImageIcon, RefreshCw, SkipForward, Type, Minus, Plus } from 'lucide-react'
import { usePresentationStore } from '../store/usePresentationStore'
import { useServiceStore } from '../store/useServiceStore'
import Button from './ui/Button'

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Spanish' },
  { code: 'pt', label: 'PT', name: 'Portuguese' }
]

export default function PresentationControls(): JSX.Element {
  const {
    isLive,
    currentItemIndex,
    currentSlideIndex,
    isBlank,
    isLogo,
    activeLanguages,
    loopCurrent,
    nextSlide,
    prevSlide,
    nextItem,
    prevItem,
    toggleBlank,
    toggleLogo,
    setLanguages,
    toggleLoop
  } = usePresentationStore()

  const activePlan = useServiceStore((s) => s.activePlan)
  const currentItem = activePlan?.items[currentItemIndex]
  const slides = currentItem?.song?.slides ?? []
  const totalSlides = slides.length || 1
  const slideLabel = slides[currentSlideIndex]?.label ?? `Slide ${currentSlideIndex + 1}`

  const toggleLanguage = async (code: string): Promise<void> => {
    let next: string[]
    if (activeLanguages.includes(code)) {
      next = activeLanguages.filter((l) => l !== code)
      if (next.length === 0) next = [code] // always keep at least one
    } else {
      next = [...activeLanguages, code]
    }
    await setLanguages(next)
  }

  return (
    <aside className="w-64 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Presentation
          </h3>
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Current item info */}
      <div className="px-4 py-3 border-b border-slate-800">
        {currentItem ? (
          <>
            <p className="text-xs text-slate-500 mb-0.5">{currentItem.type.toUpperCase()}</p>
            <p className="text-sm font-semibold text-slate-200 truncate leading-snug">
              {currentItem.song?.title ??
                currentItem.scripture?.reference ??
                currentItem.mediaFile?.title ??
                currentItem.announcementText?.slice(0, 30) ??
                'Blank'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {slideLabel} · {currentSlideIndex + 1} / {totalSlides}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-600">No item selected</p>
        )}
      </div>

      {/* Slide navigator */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={prevSlide}
            disabled={!isLive}
            className="flex-1 h-12"
            title="Previous Slide"
          >
            <ChevronLeft size={22} />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={nextSlide}
            disabled={!isLive}
            className="flex-1 h-12"
            title="Next Slide"
          >
            <ChevronRight size={22} />
          </Button>
        </div>

        {/* Slide dots (up to 8) */}
        {totalSlides > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            {slides.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => usePresentationStore.getState().goToSlide(i)}
                className={`rounded-full transition-all ${
                  i === currentSlideIndex
                    ? 'w-4 h-2 bg-brand-500'
                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
            {totalSlides > 8 && (
              <span className="text-[10px] text-slate-600">+{totalSlides - 8}</span>
            )}
          </div>
        )}
      </div>

      {/* Item navigation */}
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Item Navigation
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={prevItem}
            disabled={!isLive || currentItemIndex <= 0}
            fullWidth
          >
            <ChevronLeft size={14} /> Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={nextItem}
            disabled={!isLive}
            fullWidth
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      {/* Emergency controls */}
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Output
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="blank-toggle"
            size="md"
            onClick={toggleBlank}
            active={isBlank}
            className="h-12 flex-col gap-1 text-xs"
          >
            <Square size={18} />
            {isBlank ? 'BLANKED' : 'BLANK'}
          </Button>
          <Button
            variant="logo-toggle"
            size="md"
            onClick={toggleLogo}
            active={isLogo}
            className="h-12 flex-col gap-1 text-xs"
          >
            <ImageIcon size={18} />
            {isLogo ? 'LOGO ON' : 'LOGO'}
          </Button>
        </div>
      </div>

      {/* Language toggle */}
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Language
        </p>
        <div className="flex gap-1.5">
          {LANGUAGES.map(({ code, label, name }) => (
            <button
              key={code}
              onClick={() => toggleLanguage(code)}
              title={name}
              className={[
                'flex-1 py-2 rounded-lg text-xs font-bold transition-colors border',
                activeLanguages.includes(code)
                  ? 'bg-brand-600 text-white border-brand-500'
                  : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300'
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
        {activeLanguages.length > 1 && (
          <p className="text-[10px] text-brand-400 mt-1.5 text-center">Bilingual mode</p>
        )}
      </div>

      {/* Extras */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Options
        </p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={toggleLoop}
            className={[
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              loopCurrent
                ? 'bg-brand-900/40 text-brand-400 border border-brand-800/50'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            ].join(' ')}
          >
            <RefreshCw size={14} className={loopCurrent ? 'animate-spin-slow' : ''} />
            Loop current
          </button>
          <button
            onClick={nextSlide}
            disabled={!isLive}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SkipForward size={14} />
            Extend worship
          </button>
        </div>
      </div>
    </aside>
  )
}
