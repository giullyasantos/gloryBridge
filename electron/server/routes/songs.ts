import { Router } from 'express'
import { db, randomUUID } from '../db'

const router = Router()

// Hydrate a song with its slides, translations, and style
function hydrate(songId: string) {
  const song = db.songs.find(songId)
  if (!song) return null
  return {
    ...song,
    slides: db.slides.forSong(songId),
    translations: db.translations.forSong(songId),
    style: db.styles.forSong(songId)
  }
}

// GET /songs
router.get('/', (req, res) => {
  const { search } = req.query
  let songs = db.songs.all()
  if (search) {
    const q = (search as string).toLowerCase()
    songs = songs.filter(
      (s) => s.title.toLowerCase().includes(q) || (s.artist ?? '').toLowerCase().includes(q)
    )
  }
  res.json(songs.map((s) => hydrate(s.id)))
})

// GET /songs/:id
router.get('/:id', (req, res) => {
  const song = hydrate(req.params.id)
  if (!song) return res.status(404).json({ error: 'Not found' })
  res.json(song)
})

// POST /songs
router.post('/', (req, res) => {
  const { title, artist, language = 'en', slides = [], style } = req.body
  if (!title) return res.status(400).json({ error: 'title is required' })

  const now = new Date().toISOString()
  const song = db.songs.insert({ id: randomUUID(), title, artist, language, createdAt: now, updatedAt: now })

  if (slides.length) {
    db.slides.replaceForSong(song.id, slides)
  }
  if (style) {
    db.styles.upsert({ id: randomUUID(), songId: song.id, ...style })
  }

  res.status(201).json(hydrate(song.id))
})

// PUT /songs/:id
router.put('/:id', (req, res) => {
  const { title, artist, language, slides, style } = req.body
  const updated = db.songs.update(req.params.id, { title, artist, language })
  if (!updated) return res.status(404).json({ error: 'Not found' })

  if (slides) {
    db.slides.replaceForSong(updated.id, slides)
  }
  if (style) {
    db.styles.upsert({ id: randomUUID(), songId: updated.id, ...style })
  }

  res.json(hydrate(updated.id))
})

// DELETE /songs/:id
router.delete('/:id', (req, res) => {
  db.songs.delete(req.params.id)
  res.status(204).end()
})

// POST /songs/:id/translate — translate all slides via Claude and persist
router.post('/:id/translate', async (req, res) => {
  const { targetLanguage } = req.body
  if (!targetLanguage) return res.status(400).json({ error: 'targetLanguage required' })

  const song = hydrate(req.params.id)
  if (!song) return res.status(404).json({ error: 'Not found' })
  if (!song.slides.length) return res.status(400).json({ error: 'Song has no slides to translate' })

  const apiKey = db.settings.all()['ai.apiKey']
  if (!apiKey) return res.status(400).json({ error: 'AI API key not configured in Settings' })

  const langNames: Record<string, string> = { en: 'English', es: 'Spanish', pt: 'Portuguese' }
  const langName = langNames[targetLanguage] ?? targetLanguage
  const slidesText = song.slides.map((s) => `[${s.label}]\n${s.content}`).join('\n\n')

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Translate the following worship song slides to ${langName}. Keep the [Label] markers exactly as-is at the start of each section. Preserve all line breaks within each section. Return only the translated content:\n\n${slidesText}`
      }]
    })
  })

  if (!aiRes.ok) return res.status(500).json({ error: `Claude API error: ${aiRes.status}` })

  const aiData = await aiRes.json() as { content: Array<{ type: string; text: string }> }
  const translatedText = aiData.content.find((c) => c.type === 'text')?.text ?? ''

  const sections = translatedText.split(/\n\n(?=\[)/)
  const translatedSlides = song.slides.map((slide, i) => ({
    slideId: slide.id,
    content: (sections[i] ?? '').replace(/^\[.*?\]\n?/, '').trim()
  }))

  db.translations.upsert({
    id: randomUUID(),
    songId: song.id,
    language: targetLanguage,
    title: song.title,
    slides: translatedSlides
  })

  res.json(hydrate(song.id))
})

export default router
