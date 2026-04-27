// ─── Presentation State ───────────────────────────────────────────────────────

export interface PresentationState {
  isLive: boolean
  currentServiceId: string | null
  currentItemIndex: number
  currentSlideIndex: number
  isBlank: boolean
  isLogo: boolean
  activeLanguages: string[]
  bilingualMode: boolean
  loopCurrent: boolean
}

// ─── Songs ────────────────────────────────────────────────────────────────────

export type SlideType = 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro' | 'intro'

export interface SongSlide {
  id: string
  songId: string
  type: SlideType
  label: string
  content: string
  order: number
}

export interface SongTranslation {
  id: string
  songId: string
  language: string
  title: string
  slides: Array<{ slideId: string; content: string }>
}

export interface SongStyle {
  id: string
  songId?: string
  backgroundColor: string
  backgroundImage?: string
  fontFamily: string
  fontSize: number
  fontColor: string
  textAlign: 'left' | 'center' | 'right'
  fontWeight: 'normal' | 'bold'
  textShadow: boolean
  shadowColor: string
  lineHeight: number
  letterSpacing: number
}

export interface Song {
  id: string
  title: string
  artist?: string
  language: string
  createdAt: string
  updatedAt: string
  slides: SongSlide[]
  translations: SongTranslation[]
  style?: SongStyle
}

// ─── Scripture ────────────────────────────────────────────────────────────────

export interface Scripture {
  id: string
  reference: string
  book: string
  chapter: number
  verseStart: number
  verseEnd?: number
  version: string
  text: string
  language: string
  createdAt: string
}

export type BibleVersion = 'NIV' | 'ESV' | 'KJV' | 'NLT' | 'RVR1960' | 'ARA'

export const BIBLE_VERSIONS: BibleVersion[] = ['NIV', 'ESV', 'KJV', 'NLT', 'RVR1960', 'ARA']

// ─── Media ────────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'audio'

export interface MediaFile {
  id: string
  type: MediaType
  title: string
  filePath: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

// ─── Service Plan ─────────────────────────────────────────────────────────────

export type ServiceItemType = 'song' | 'scripture' | 'media' | 'announcement' | 'blank'

export interface ServiceItem {
  id: string
  servicePlanId: string
  order: number
  type: ServiceItemType
  songId?: string
  scriptureId?: string
  mediaFileId?: string
  announcementText?: string
  durationSecs?: number
  notes?: string
  // Resolved relations (populated by backend)
  song?: Song
  scripture?: Scripture
  mediaFile?: MediaFile
}

export interface ServicePlan {
  id: string
  title: string
  date?: string
  notes?: string
  createdAt: string
  updatedAt: string
  items: ServiceItem[]
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  'display.outputMonitorIndex': number
  'display.defaultLanguage': string
  'display.fallbackLanguage': string
  'ai.apiKey': string
  'stream.youtubeKey': string
  'stream.facebookKey': string
  'presentation.defaultFontSize': number
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type NavSection = 'service' | 'media' | 'scripture' | 'settings'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export interface MonitorInfo {
  index: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  isPrimary: boolean
}

// ─── Slide Content (for output window) ───────────────────────────────────────

export interface SlideContent {
  type: ServiceItemType
  primaryText?: string
  secondaryText?: string
  backgroundImage?: string
  backgroundColor?: string
  fontFamily?: string
  fontSize?: number
  fontColor?: string
  textAlign?: string
  fontWeight?: string
  textShadow?: boolean
  lineHeight?: number
  reference?: string // for scripture
  mediaUrl?: string // for media
}
