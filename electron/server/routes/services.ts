import { Router } from 'express'
import { db, randomUUID } from '../db'

const router = Router()

function hydrateItem(item: ReturnType<typeof db.items.forPlan>[number]) {
  return {
    ...item,
    song: item.songId ? (() => {
      const s = db.songs.find(item.songId!)
      if (!s) return undefined
      return { ...s, slides: db.slides.forSong(s.id), translations: db.translations.forSong(s.id), style: db.styles.forSong(s.id) }
    })() : undefined,
    scripture: item.scriptureId ? db.scriptures.find(item.scriptureId) : undefined,
    mediaFile: item.mediaFileId ? db.media.find(item.mediaFileId) : undefined
  }
}

function hydratePlan(planId: string) {
  const plan = db.plans.find(planId)
  if (!plan) return null
  return {
    ...plan,
    items: db.items.forPlan(planId).map(hydrateItem)
  }
}

// GET /services
router.get('/', (_req, res) => {
  const plans = db.plans.all().map((p) => ({
    ...p,
    items: db.items.forPlan(p.id).map(hydrateItem)
  }))
  res.json(plans)
})

// GET /services/:id
router.get('/:id', (req, res) => {
  const plan = hydratePlan(req.params.id)
  if (!plan) return res.status(404).json({ error: 'Not found' })
  res.json(plan)
})

// POST /services
router.post('/', (req, res) => {
  const { title, date, notes } = req.body
  if (!title) return res.status(400).json({ error: 'title is required' })
  const now = new Date().toISOString()
  const plan = db.plans.insert({ id: randomUUID(), title, date, notes, createdAt: now, updatedAt: now })
  res.status(201).json({ ...plan, items: [] })
})

// PUT /services/:id
router.put('/:id', (req, res) => {
  const { title, date, notes } = req.body
  const updated = db.plans.update(req.params.id, { title, date, notes })
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json(hydratePlan(updated.id))
})

// DELETE /services/:id
router.delete('/:id', (req, res) => {
  db.plans.delete(req.params.id)
  res.status(204).end()
})

// POST /services/:id/items
router.post('/:id/items', (req, res) => {
  const { type, refId, text } = req.body
  const plan = db.plans.find(req.params.id)
  if (!plan) return res.status(404).json({ error: 'Not found' })

  const existingItems = db.items.forPlan(plan.id)
  const order = existingItems.length

  const item = db.items.insert({
    id: randomUUID(),
    servicePlanId: plan.id,
    order,
    type,
    songId: type === 'song' ? refId : undefined,
    scriptureId: type === 'scripture' ? refId : undefined,
    mediaFileId: type === 'media' ? refId : undefined,
    announcementText: type === 'announcement' ? (text ?? 'Announcement') : undefined
  })

  res.status(201).json(hydrateItem(item))
})

// DELETE /services/:id/items/:itemId
router.delete('/:id/items/:itemId', (req, res) => {
  db.items.delete(req.params.itemId)
  res.status(204).end()
})

// PUT /services/:id/reorder
router.put('/:id/reorder', (req, res) => {
  const { itemIds } = req.body
  if (!Array.isArray(itemIds)) return res.status(400).json({ error: 'itemIds array required' })
  db.items.reorder(req.params.id, itemIds)
  res.json(hydratePlan(req.params.id))
})

export default router
