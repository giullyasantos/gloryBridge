import { Router } from 'express'
import { db } from '../db'

const router = Router()

const DEFAULTS: Record<string, string> = {
  'display.outputMonitorIndex': '1',
  'display.defaultLanguage': 'en',
  'display.fallbackLanguage': 'en',
  'ai.apiKey': '',
  'stream.youtubeKey': '',
  'stream.facebookKey': '',
  'presentation.defaultFontSize': '48'
}

function parseSettings(raw: Record<string, string>) {
  const s = { ...DEFAULTS, ...raw }
  return {
    'display.outputMonitorIndex': Number(s['display.outputMonitorIndex']),
    'display.defaultLanguage': s['display.defaultLanguage'],
    'display.fallbackLanguage': s['display.fallbackLanguage'],
    'ai.apiKey': s['ai.apiKey'],
    'stream.youtubeKey': s['stream.youtubeKey'],
    'stream.facebookKey': s['stream.facebookKey'],
    'presentation.defaultFontSize': Number(s['presentation.defaultFontSize'])
  }
}

// GET /settings
router.get('/', (_req, res) => {
  res.json(parseSettings(db.settings.all()))
})

// PUT /settings
router.put('/', (req, res) => {
  const updates: Record<string, string> = {}
  for (const [k, v] of Object.entries(req.body)) {
    updates[k] = String(v)
  }
  db.settings.merge(updates)
  res.json(parseSettings(db.settings.all()))
})

export default router
