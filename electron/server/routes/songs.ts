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

// POST /songs/:id/translate — stub (real AI in ai route)
router.post('/:id/translate', (req, res) => {
  res.status(202).json({ message: 'Translation queued' })
})

export default router
