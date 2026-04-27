import { Router } from 'express'
import { db } from '../db'

const router = Router()

async function callClaude(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })
  })
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
  const data = await res.json() as { content: Array<{ type: string; text: string }> }
  return data.content.find((c) => c.type === 'text')?.text ?? ''
}

function getApiKey(): string {
  return db.settings.all()['ai.apiKey'] ?? ''
}

// POST /ai/translate
router.post('/translate', async (req, res) => {
  const { text, targetLanguage } = req.body
  if (!text || !targetLanguage) return res.status(400).json({ error: 'text and targetLanguage required' })

  const apiKey = getApiKey()
  if (!apiKey) return res.status(400).json({ error: 'AI API key not configured in Settings' })

  try {
    const translated = await callClaude(
      apiKey,
      `Translate the following worship song lyrics to ${targetLanguage}. Preserve the line breaks and song structure. Only return the translated text, nothing else:\n\n${text}`
    )
    res.json({ translated })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// POST /ai/suggest
router.post('/suggest', async (req, res) => {
  const { theme } = req.body
  if (!theme) return res.status(400).json({ error: 'theme required' })

  const apiKey = getApiKey()
  if (!apiKey) return res.status(400).json({ error: 'AI API key not configured' })

  try {
    const result = await callClaude(
      apiKey,
      `Suggest 5 worship songs and 3 Bible scriptures appropriate for a church service with the theme: "${theme}". Return JSON in this exact format: {"songs": ["Song Title 1", ...], "scriptures": ["John 3:16", ...]}`
    )
    const parsed = JSON.parse(result)
    res.json(parsed)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// POST /ai/create-song
router.post('/create-song', async (req, res) => {
  const { prompt } = req.body
  if (!prompt) return res.status(400).json({ error: 'prompt required' })

  const apiKey = getApiKey()
  if (!apiKey) return res.status(400).json({ error: 'AI API key not configured' })

  try {
    const result = await callClaude(
      apiKey,
      `Write a complete worship song based on this prompt: "${prompt}". Include verse 1, chorus, verse 2, and bridge sections. Return JSON: {"title": "...", "slides": [{"type": "verse|chorus|bridge", "label": "Verse 1|Chorus|etc", "content": "lyrics here\nwith line breaks"}]}`
    )
    const parsed = JSON.parse(result)
    res.json(parsed)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

export default router
