import express from 'express'
import cors from 'cors'
import songsRouter from './routes/songs'
import scripturesRouter from './routes/scriptures'
import servicesRouter from './routes/services'
import mediaRouter from './routes/media'
import settingsRouter from './routes/settings'
import aiRouter from './routes/ai'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))

  // Routes
  app.use('/api/v1/songs', songsRouter)
  app.use('/api/v1/scriptures', scripturesRouter)
  app.use('/api/v1/services', servicesRouter)
  app.use('/api/v1/media', mediaRouter)
  app.use('/api/v1/settings', settingsRouter)
  app.use('/api/v1/ai', aiRouter)

  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

  return app
}
