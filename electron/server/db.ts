/**
 * Simple JSON file store — no native modules, works everywhere.
 * All data lives in userData/glorybridge-data.json.
 * Reads on startup, writes on every mutation.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

export { randomUUID }

export interface DbSongSlide {
  id: string
  songId: string
  type: string
  label: string
  content: string
  order: number
}

export interface DbSongTranslation {
  id: string
  songId: string
  language: string
  title: string
  slides: Array<{ slideId: string; content: string }>
}

export interface DbSongStyle {
  id: string
  songId: string | null
  backgroundColor: string
  backgroundImage?: string
  fontFamily: string
  fontSize: number
  fontColor: string
  textAlign: string
  fontWeight: string
  textShadow: boolean
  shadowColor: string
  lineHeight: number
  letterSpacing: number
}

export interface DbSong {
  id: string
  title: string
  artist?: string
  language: string
  createdAt: string
  updatedAt: string
}

export interface DbScripture {
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

export interface DbMediaFile {
  id: string
  type: string
  title: string
  filePath: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export interface DbServicePlan {
  id: string
  title: string
  date?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DbServiceItem {
  id: string
  servicePlanId: string
  order: number
  type: string
  songId?: string
  scriptureId?: string
  mediaFileId?: string
  announcementText?: string
  durationSecs?: number
  notes?: string
}

export interface DbSettings {
  [key: string]: string
}

interface DbData {
  songs: DbSong[]
  songSlides: DbSongSlide[]
  songTranslations: DbSongTranslation[]
  songStyles: DbSongStyle[]
  scriptures: DbScripture[]
  mediaFiles: DbMediaFile[]
  servicePlans: DbServicePlan[]
  serviceItems: DbServiceItem[]
  settings: DbSettings
  seeded: boolean
}

let dbPath = ''
let data: DbData = {
  songs: [],
  songSlides: [],
  songTranslations: [],
  songStyles: [],
  scriptures: [],
  mediaFiles: [],
  servicePlans: [],
  serviceItems: [],
  settings: {},
  seeded: false
}

export function initDb(userDataPath: string): void {
  const dir = join(userDataPath, 'glorybridge')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  dbPath = join(dir, 'data.json')

  if (existsSync(dbPath)) {
    try {
      data = JSON.parse(readFileSync(dbPath, 'utf-8'))
    } catch {
      // corrupted — start fresh
    }
  }

  if (!data.seeded) {
    seed()
    data.seeded = true
    save()
  }
}

function save(): void {
  if (!dbPath) return
  writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
}

// ─── Seed data ────────────────────────────────────────────────────────────────

function seed(): void {
  const now = new Date().toISOString()

  // Default style
  const globalStyleId = randomUUID()
  data.songStyles.push({
    id: globalStyleId,
    songId: null,
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
  })

  // Sample songs
  const amazingGraceId = randomUUID()
  data.songs.push({ id: amazingGraceId, title: 'Amazing Grace', artist: 'John Newton', language: 'en', createdAt: now, updatedAt: now })
  const agSlides = [
    { label: 'Verse 1', content: 'Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind, but now I see' },
    { label: 'Verse 2', content: "'Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed" },
    { label: 'Chorus', content: 'My chains are gone\nI\'ve been set free\nMy God, my Savior has ransomed me\nAnd like a flood, His mercy reigns\nUnending love, amazing grace' },
    { label: 'Verse 3', content: 'The Lord has promised good to me\nHis word my hope secures\nHe will my shield and portion be\nAs long as life endures' }
  ]
  agSlides.forEach((s, i) => {
    data.songSlides.push({ id: randomUUID(), songId: amazingGraceId, type: i === 2 ? 'chorus' : 'verse', label: s.label, content: s.content, order: i })
  })
  data.songTranslations.push({
    id: randomUUID(),
    songId: amazingGraceId,
    language: 'es',
    title: 'Sublime gracia',
    slides: [
      { slideId: data.songSlides.at(-4)!.id, content: 'Sublime gracia del Señor\nQue a mí pecador salvó\nFui ciego mas hoy veo yo\nPerdido y Él me halló' },
      { slideId: data.songSlides.at(-3)!.id, content: 'Su gracia me enseñó a temer\nMis dudas ahuyentó\nOh cuán glorioso fue el creer\nPor gracia Dios me amó' },
      { slideId: data.songSlides.at(-2)!.id, content: 'Mis cadenas se rompieron\nSoy libre por su amor\nSu misericordia no cesa\nGracia sin límite de Dios' },
      { slideId: data.songSlides.at(-1)!.id, content: 'Su promesa es mi sostén\nSu Palabra mi calor\nÉl será mi escudo y bien\nMientras viva con amor' }
    ]
  })
  data.songStyles.push({ id: randomUUID(), songId: amazingGraceId, backgroundColor: '#0a0014', fontFamily: 'Inter', fontSize: 48, fontColor: '#FFFFFF', textAlign: 'center', fontWeight: 'normal', textShadow: true, shadowColor: '#000000', lineHeight: 1.4, letterSpacing: 0 })

  const howGreatId = randomUUID()
  data.songs.push({ id: howGreatId, title: 'How Great Is Our God', artist: 'Chris Tomlin', language: 'en', createdAt: now, updatedAt: now })
  const hgSlides = [
    { type: 'verse', label: 'Verse 1', content: 'The splendor of the King\nClothed in majesty\nLet all the earth rejoice\nAll the earth rejoice' },
    { type: 'verse', label: 'Verse 2', content: 'Age to age He stands\nAnd time is in His hands\nBeginning and the end\nBeginning and the end' },
    { type: 'chorus', label: 'Chorus', content: 'How great is our God\nSing with me\nHow great is our God\nAnd all will see\nHow great, how great is our God' },
    { type: 'bridge', label: 'Bridge', content: 'Name above all names\nWorthy of all praise\nMy heart will sing\nHow great is our God' }
  ]
  hgSlides.forEach((s, i) => {
    data.songSlides.push({ id: randomUUID(), songId: howGreatId, type: s.type, label: s.label, content: s.content, order: i })
  })

  const wayMakerPorId = randomUUID()
  data.songs.push({ id: wayMakerPorId, title: 'Way Maker', artist: 'Sinach', language: 'en', createdAt: now, updatedAt: now })
  const wmSlides = [
    { type: 'verse', label: 'Verse', content: 'You are here moving in our midst\nI worship You, I worship You\nYou are here working in this place\nI worship You, I worship You' },
    { type: 'chorus', label: 'Chorus', content: 'Way maker, miracle worker\nPromise keeper, light in the darkness\nMy God, that is who You are' },
    { type: 'bridge', label: 'Bridge', content: 'Even when I don\'t see it\nYou\'re working\nEven when I don\'t feel it\nYou\'re working\nYou never stop, You never stop working' }
  ]
  wmSlides.forEach((s, i) => {
    data.songSlides.push({ id: randomUUID(), songId: wayMakerPorId, type: s.type, label: s.label, content: s.content, order: i })
  })

  const oceansId = randomUUID()
  data.songs.push({ id: oceansId, title: 'Oceans (Where Feet May Fail)', artist: 'Hillsong UNITED', language: 'en', createdAt: now, updatedAt: now })
  const oceanSlides = [
    { type: 'verse', label: 'Verse 1', content: 'You call me out upon the waters\nThe great unknown where feet may fail\nAnd there I find You in the mystery\nIn oceans deep my faith will stand' },
    { type: 'chorus', label: 'Chorus', content: 'And I will call upon Your name\nAnd keep my eyes above the waves\nWhen oceans rise, my soul will rest\nIn Your embrace, for I am Yours\nAnd You are mine' },
    { type: 'bridge', label: 'Bridge', content: 'Spirit lead me where my trust is without borders\nLet me walk upon the waters\nWherever You would call me\nTake me deeper than my feet could ever wander' }
  ]
  oceanSlides.forEach((s, i) => {
    data.songSlides.push({ id: randomUUID(), songId: oceansId, type: s.type, label: s.label, content: s.content, order: i })
  })

  const resurrectionId = randomUUID()
  data.songs.push({ id: resurrectionId, title: 'Resurrection Power', artist: 'Chris Tomlin', language: 'en', createdAt: now, updatedAt: now })
  const rpSlides = [
    { type: 'verse', label: 'Verse', content: 'There is power in the name of Jesus\nTo break every chain, break every chain\nThere is power in the name of Jesus' },
    { type: 'chorus', label: 'Chorus', content: 'I have resurrection power\nLiving on the inside\nJesus You have given us freedom\nWe\'re no longer slaves to sin' }
  ]
  rpSlides.forEach((s, i) => {
    data.songSlides.push({ id: randomUUID(), songId: resurrectionId, type: s.type, label: s.label, content: s.content, order: i })
  })

  // Sample scriptures
  const scriptureSeed = [
    { reference: 'John 3:16', book: 'John', chapter: 3, verseStart: 16, version: 'NIV' as const, text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', language: 'en' },
    { reference: 'Psalm 23:1', book: 'Psalm', chapter: 23, verseStart: 1, version: 'NIV' as const, text: 'The Lord is my shepherd, I lack nothing.', language: 'en' },
    { reference: 'Romans 8:28', book: 'Romans', chapter: 8, verseStart: 28, version: 'NIV' as const, text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', language: 'en' },
    { reference: 'Philippians 4:13', book: 'Philippians', chapter: 4, verseStart: 13, version: 'NIV' as const, text: 'I can do all this through him who gives me strength.', language: 'en' },
    { reference: 'Jeremiah 29:11', book: 'Jeremiah', chapter: 29, verseStart: 11, version: 'NIV' as const, text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."', language: 'en' },
    { reference: 'Isaiah 41:10', book: 'Isaiah', chapter: 41, verseStart: 10, version: 'NIV' as const, text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', language: 'en' },
    { reference: 'Proverbs 3:5-6', book: 'Proverbs', chapter: 3, verseStart: 5, verseEnd: 6, version: 'NIV' as const, text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', language: 'en' },
    { reference: 'Matthew 6:33', book: 'Matthew', chapter: 6, verseStart: 33, version: 'NIV' as const, text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', language: 'en' },
    { reference: 'Psalm 46:1', book: 'Psalm', chapter: 46, verseStart: 1, version: 'NIV' as const, text: 'God is our refuge and strength, an ever-present help in trouble.', language: 'en' },
    { reference: '2 Corinthians 5:17', book: '2 Corinthians', chapter: 5, verseStart: 17, version: 'NIV' as const, text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!', language: 'en' }
  ]
  scriptureSeed.forEach((s) => {
    data.scriptures.push({ id: randomUUID(), ...s, createdAt: now })
  })

  // Default settings
  data.settings = {
    'display.outputMonitorIndex': '1',
    'display.defaultLanguage': 'en',
    'display.fallbackLanguage': 'en',
    'ai.apiKey': '',
    'stream.youtubeKey': '',
    'stream.facebookKey': '',
    'presentation.defaultFontSize': '48'
  }

  // Sample service plan
  const planId = randomUUID()
  data.servicePlans.push({
    id: planId,
    title: 'Sunday Morning Service',
    date: new Date().toISOString(),
    notes: 'Welcome service',
    createdAt: now,
    updatedAt: now
  })
  const itemTypes = [
    { type: 'song', songId: howGreatId },
    { type: 'song', songId: amazingGraceId },
    { type: 'scripture', scriptureId: data.scriptures[0].id },
    { type: 'song', songId: wayMakerPorId },
    { type: 'announcement', announcementText: 'Join us for lunch after service!' }
  ] as const
  itemTypes.forEach((item, i) => {
    data.serviceItems.push({
      id: randomUUID(),
      servicePlanId: planId,
      order: i,
      ...item
    } as DbServiceItem)
  })
}

// ─── DB accessors ─────────────────────────────────────────────────────────────

export const db = {
  // Songs
  songs: {
    all: () => data.songs,
    find: (id: string) => data.songs.find((s) => s.id === id),
    insert: (song: DbSong) => { data.songs.push(song); save(); return song },
    update: (id: string, updates: Partial<DbSong>) => {
      const i = data.songs.findIndex((s) => s.id === id)
      if (i < 0) return null
      data.songs[i] = { ...data.songs[i], ...updates, updatedAt: new Date().toISOString() }
      save()
      return data.songs[i]
    },
    delete: (id: string) => {
      data.songs = data.songs.filter((s) => s.id !== id)
      data.songSlides = data.songSlides.filter((s) => s.songId !== id)
      data.songTranslations = data.songTranslations.filter((s) => s.songId !== id)
      data.songStyles = data.songStyles.filter((s) => s.songId !== id)
      save()
    }
  },

  // Slides
  slides: {
    forSong: (songId: string) => data.songSlides.filter((s) => s.songId === songId).sort((a, b) => a.order - b.order),
    replaceForSong: (songId: string, slides: Omit<DbSongSlide, 'id' | 'songId'>[]) => {
      data.songSlides = data.songSlides.filter((s) => s.songId !== songId)
      const inserted = slides.map((s, i) => ({ ...s, id: randomUUID(), songId, order: i }))
      data.songSlides.push(...inserted)
      save()
      return inserted
    }
  },

  // Translations
  translations: {
    forSong: (songId: string) => data.songTranslations.filter((t) => t.songId === songId),
    upsert: (t: DbSongTranslation) => {
      const i = data.songTranslations.findIndex((x) => x.songId === t.songId && x.language === t.language)
      if (i >= 0) { data.songTranslations[i] = t; } else { data.songTranslations.push(t) }
      save()
      return t
    }
  },

  // Styles
  styles: {
    forSong: (songId: string) => data.songStyles.find((s) => s.songId === songId) ?? data.songStyles.find((s) => !s.songId) ?? null,
    global: () => data.songStyles.find((s) => !s.songId) ?? null,
    upsert: (style: DbSongStyle) => {
      const i = data.songStyles.findIndex((s) => s.songId === style.songId)
      if (i >= 0) { data.songStyles[i] = style; } else { data.songStyles.push(style) }
      save()
      return style
    }
  },

  // Scriptures
  scriptures: {
    all: () => data.scriptures,
    find: (id: string) => data.scriptures.find((s) => s.id === id),
    search: (q: string) => {
      const lower = q.toLowerCase()
      return data.scriptures.filter(
        (s) => s.reference.toLowerCase().includes(lower) || s.text.toLowerCase().includes(lower)
      )
    },
    insert: (s: DbScripture) => { data.scriptures.push(s); save(); return s },
    delete: (id: string) => { data.scriptures = data.scriptures.filter((s) => s.id !== id); save() }
  },

  // Media
  media: {
    all: (type?: string) => type ? data.mediaFiles.filter((m) => m.type === type) : data.mediaFiles,
    find: (id: string) => data.mediaFiles.find((m) => m.id === id),
    insert: (m: DbMediaFile) => { data.mediaFiles.push(m); save(); return m },
    delete: (id: string) => { data.mediaFiles = data.mediaFiles.filter((m) => m.id !== id); save() }
  },

  // Service plans
  plans: {
    all: () => data.servicePlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    find: (id: string) => data.servicePlans.find((p) => p.id === id),
    insert: (p: DbServicePlan) => { data.servicePlans.push(p); save(); return p },
    update: (id: string, updates: Partial<DbServicePlan>) => {
      const i = data.servicePlans.findIndex((p) => p.id === id)
      if (i < 0) return null
      data.servicePlans[i] = { ...data.servicePlans[i], ...updates, updatedAt: new Date().toISOString() }
      save()
      return data.servicePlans[i]
    },
    delete: (id: string) => {
      data.servicePlans = data.servicePlans.filter((p) => p.id !== id)
      data.serviceItems = data.serviceItems.filter((i) => i.servicePlanId !== id)
      save()
    }
  },

  // Service items
  items: {
    forPlan: (planId: string) => data.serviceItems.filter((i) => i.servicePlanId === planId).sort((a, b) => a.order - b.order),
    insert: (item: DbServiceItem) => { data.serviceItems.push(item); save(); return item },
    delete: (id: string) => { data.serviceItems = data.serviceItems.filter((i) => i.id !== id); save() },
    reorder: (planId: string, itemIds: string[]) => {
      itemIds.forEach((id, order) => {
        const i = data.serviceItems.findIndex((x) => x.id === id && x.servicePlanId === planId)
        if (i >= 0) data.serviceItems[i].order = order
      })
      save()
    }
  },

  // Settings
  settings: {
    all: () => data.settings,
    set: (key: string, value: string) => { data.settings[key] = value; save() },
    merge: (updates: Record<string, string>) => { Object.assign(data.settings, updates); save() }
  }
}
