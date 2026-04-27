import { useEffect, useState } from 'react'
import { usePresentationStore } from '../store/usePresentationStore'
import { useServiceStore } from '../store/useServiceStore'
import type { ServiceItem, SongStyle, SlideContent } from '../types'

const toFileUrl = (path: string): string =>
  path.startsWith('file://') || path.startsWith('http') ? path : `file://${path}`

// ─── Slide renderer ───────────────────────────────────────────────────────────

function resolveSlideContent(item: ServiceItem | undefined, slideIndex: number, languages: string[], bilingualMode: boolean): SlideContent | null {
  if (!item) return null

  if (item.type === 'blank' || !item) {
    return { type: 'blank', backgroundColor: '#000000' }
  }

  if (item.type === 'song' && item.song) {
    const song = item.song
    const slide = song.slides[slideIndex]
    if (!slide) return null

    const primaryLang = languages[0] ?? 'en'
    let primaryText = slide.content

    // Check if song's primary language matches
    if (song.language !== primaryLang) {
      const translation = song.translations?.find((t) => t.language === primaryLang)
      const translatedSlide = translation?.slides.find((s) => s.slideId === slide.id)
      if (translatedSlide) primaryText = translatedSlide.content
    }

    let secondaryText: string | undefined
    if (bilingualMode && languages[1]) {
      const secLang = languages[1]
      if (song.language === secLang) {
        secondaryText = slide.content
      } else {
        const translation = song.translations?.find((t) => t.language === secLang)
        const translatedSlide = translation?.slides.find((s) => s.slideId === slide.id)
        secondaryText = translatedSlide?.content
      }
    }

    const s = song.style
    return {
      type: 'song',
      primaryText,
      secondaryText,
      backgroundColor: s?.backgroundColor ?? '#000000',
      backgroundImage: s?.backgroundImage,
      fontFamily: s?.fontFamily ?? 'Inter',
      fontSize: s?.fontSize ?? 48,
      fontColor: s?.fontColor ?? '#FFFFFF',
      textAlign: s?.textAlign ?? 'center',
      fontWeight: s?.fontWeight ?? 'normal',
      textShadow: s?.textShadow ?? true,
      lineHeight: s?.lineHeight ?? 1.4
    }
  }

  if (item.type === 'scripture' && item.scripture) {
    const sc = item.scripture
    return {
      type: 'scripture',
      primaryText: sc.text,
      reference: sc.reference,
      backgroundColor: '#0a0a14',
      fontColor: '#FFFFFF',
      fontFamily: 'Georgia',
      fontSize: 36,
      textAlign: 'center',
      fontWeight: 'normal',
      textShadow: false,
      lineHeight: 1.6
    }
  }

  if (item.type === 'announcement') {
    return {
      type: 'announcement',
      primaryText: item.announcementText ?? '',
      backgroundColor: '#0f172a',
      fontColor: '#FFFFFF',
      fontFamily: 'Inter',
      fontSize: 52,
      textAlign: 'center',
      fontWeight: 'bold',
      textShadow: false,
      lineHeight: 1.3
    }
  }

  if (item.type === 'media' && item.mediaFile) {
    return {
      type: 'media',
      mediaUrl: `file://${item.mediaFile.filePath}`,
      backgroundColor: '#000000'
    }
  }

  return { type: 'blank', backgroundColor: '#000000' }
}

// ─── Presentation Window ──────────────────────────────────────────────────────

export default function PresentationWindow(): JSX.Element {
  const {
    isLive,
    currentItemIndex,
    currentSlideIndex,
    isBlank,
    isLogo,
    activeLanguages,
    bilingualMode
  } = usePresentationStore()

  const activePlan = useServiceStore((s) => s.activePlan)
  const currentItem = activePlan?.items[currentItemIndex]

  const [content, setContent] = useState<SlideContent | null>(null)
  const [key, setKey] = useState(0) // force re-render for transition

  useEffect(() => {
    const resolved = resolveSlideContent(
      currentItem,
      currentSlideIndex,
      activeLanguages,
      bilingualMode
    )
    setContent(resolved)
    setKey((k) => k + 1)
  }, [currentItem, currentSlideIndex, activeLanguages, bilingualMode])

  // ── Blank screen ──
  if (isBlank || !isLive) {
    return <div className="w-screen h-screen bg-black" />
  }

  // ── Logo/Hold slide ──
  if (isLogo) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold text-4xl">G</span>
          </div>
          <span className="text-white/60 text-xl font-light tracking-widest uppercase">GloryBridge</span>
        </div>
      </div>
    )
  }

  if (!content) {
    return <div className="w-screen h-screen bg-black" />
  }

  // ── Media slide ──
  if (content.type === 'media' && content.mediaUrl) {
    const isVideo = content.mediaUrl.match(/\.(mp4|mov|avi|webm|mkv)$/i)
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <video
            key={content.mediaUrl}
            src={content.mediaUrl}
            className="w-full h-full object-contain"
            autoPlay
            loop
          />
        ) : (
          <img
            src={content.mediaUrl}
            alt=""
            className="w-full h-full object-contain"
          />
        )}
      </div>
    )
  }

  // ── Text slide (song, scripture, announcement) ──
  const textShadow = content.textShadow
    ? `0 2px 12px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.9)`
    : 'none'

  return (
    <div
      className="w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{
        backgroundColor: content.backgroundColor ?? '#000000',
        backgroundImage: content.backgroundImage ? `url(${toFileUrl(content.backgroundImage)})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background overlay when using background image */}
      {content.backgroundImage && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      <div
        key={key}
        className="relative z-10 slide-transition px-12 py-8 max-w-5xl w-full"
        style={{ textAlign: content.textAlign as 'left' | 'center' | 'right' ?? 'center' }}
      >
        {/* Primary text */}
        {content.primaryText && (
          <p
            style={{
              fontFamily: content.fontFamily ?? 'Inter',
              fontSize: `${content.fontSize ?? 48}px`,
              color: content.fontColor ?? '#FFFFFF',
              fontWeight: content.fontWeight ?? 'normal',
              lineHeight: content.lineHeight ?? 1.4,
              textShadow,
              whiteSpace: 'pre-wrap'
            }}
          >
            {content.primaryText}
          </p>
        )}

        {/* Secondary text (bilingual) */}
        {content.secondaryText && (
          <>
            <div className="my-6 border-t border-white/20" />
            <p
              style={{
                fontFamily: content.fontFamily ?? 'Inter',
                fontSize: `${Math.round((content.fontSize ?? 48) * 0.75)}px`,
                color: `${content.fontColor ?? '#FFFFFF'}cc`,
                fontWeight: content.fontWeight ?? 'normal',
                lineHeight: content.lineHeight ?? 1.4,
                textShadow,
                whiteSpace: 'pre-wrap'
              }}
            >
              {content.secondaryText}
            </p>
          </>
        )}

        {/* Scripture reference */}
        {content.type === 'scripture' && content.reference && (
          <p
            className="mt-6 font-semibold tracking-wide"
            style={{
              fontSize: `${Math.round((content.fontSize ?? 36) * 0.55)}px`,
              color: `${content.fontColor ?? '#FFFFFF'}99`,
              textShadow
            }}
          >
            — {content.reference}
          </p>
        )}
      </div>
    </div>
  )
}
