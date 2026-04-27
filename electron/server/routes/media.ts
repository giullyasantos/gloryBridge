import { Router } from 'express'
import { db, randomUUID } from '../db'
import { statSync } from 'fs'
import { basename, extname } from 'path'

const router = Router()

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/avi',
    '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
    '.aac': 'audio/aac', '.m4a': 'audio/mp4'
  }
  return map[ext.toLowerCase()] ?? 'application/octet-stream'
}

function typeFromMime(mime: string): 'image' | 'video' | 'audio' {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'audio'
}

// GET /media
router.get('/', (req, res) => {
  const { type } = req.query
  res.json(db.media.all(type as string | undefined))
})

// POST /media/upload
router.post('/upload', (req, res) => {
  const { filePath } = req.body
  if (!filePath) return res.status(400).json({ error: 'filePath required' })

  let sizeBytes = 0
  try {
    sizeBytes = statSync(filePath).size
  } catch {
    // file may not exist in dev
  }

  const ext = extname(filePath)
  const mimeType = mimeFromExt(ext)
  const file = db.media.insert({
    id: randomUUID(),
    type: typeFromMime(mimeType),
    title: basename(filePath, ext),
    filePath,
    mimeType,
    sizeBytes,
    createdAt: new Date().toISOString()
  })

  res.status(201).json(file)
})

// DELETE /media/:id
router.delete('/:id', (req, res) => {
  db.media.delete(req.params.id)
  res.status(204).end()
})

export default router
