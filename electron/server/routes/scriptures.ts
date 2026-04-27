import { Router } from 'express'
import { db, randomUUID } from '../db'

const router = Router()

// GET /scriptures
router.get('/', (_req, res) => {
  res.json(db.scriptures.all())
})

// GET /scriptures/versions
router.get('/versions', (_req, res) => {
  res.json(['NIV', 'ESV', 'KJV', 'NLT', 'RVR1960', 'ARA'])
})

// GET /scriptures/search?q=...&version=...
router.get('/search', (req, res) => {
  const { q, version } = req.query
  if (!q) return res.status(400).json({ error: 'q is required' })

  let results = db.scriptures.search(q as string)

  if (version) {
    const versionResults = results.filter((s) => s.version === version)
    // If we have version-specific results use them, else return all matches
    if (versionResults.length) results = versionResults
  }

  res.json(results)
})

// POST /scriptures
router.post('/', (req, res) => {
  const { reference, book, chapter, verseStart, verseEnd, version, text, language = 'en' } = req.body
  if (!reference || !text) return res.status(400).json({ error: 'reference and text are required' })

  const scripture = db.scriptures.insert({
    id: randomUUID(),
    reference,
    book: book ?? reference.split(' ')[0],
    chapter: chapter ?? 1,
    verseStart: verseStart ?? 1,
    verseEnd,
    version: version ?? 'NIV',
    text,
    language,
    createdAt: new Date().toISOString()
  })

  res.status(201).json(scripture)
})

// DELETE /scriptures/:id
router.delete('/:id', (req, res) => {
  db.scriptures.delete(req.params.id)
  res.status(204).end()
})

export default router
