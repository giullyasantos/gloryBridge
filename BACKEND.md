# GloryBridge — Backend Requirements

## Overview
The backend is a local Node.js service that runs alongside the Electron app. It handles business logic, AI integrations, external API calls (Bible APIs, streaming platforms), and exposes a REST API consumed by the Electron renderer process.

For MVP, this runs **locally** (same machine). Cloud deployment comes later.

## Tech Stack
- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Real-time:** Socket.io (for remote operator sync)
- **AI Integration:** Anthropic Claude API
- **Testing:** Jest + Supertest
- **Documentation:** Swagger / OpenAPI 3.0

---

## Architecture

```
Electron Renderer (React)
        ↕ HTTP / IPC
Local Express Server
        ↕
  ┌─────────────────────┐
  │  SQLite (Prisma)    │
  │  Bible API (ext)    │
  │  Claude API (ext)   │
  │  Stream APIs (ext)  │
  └─────────────────────┘
```

---

## API Modules

### 1. Songs
- `GET /api/v1/songs` — list all songs (with search/filter)
- `GET /api/v1/songs/:id` — get song with all slides/translations
- `POST /api/v1/songs` — create song
- `PUT /api/v1/songs/:id` — update song
- `DELETE /api/v1/songs/:id` — delete song
- `POST /api/v1/songs/:id/translate` — AI translate to target language

### 2. Scriptures
- `GET /api/v1/scriptures` — list saved scriptures
- `GET /api/v1/scriptures/search` — search by reference or keyword
- `GET /api/v1/scriptures/versions` — list available Bible versions
- `POST /api/v1/scriptures` — save scripture to library
- `DELETE /api/v1/scriptures/:id`

### 3. Services (Service Plans)
- `GET /api/v1/services` — list saved service plans
- `GET /api/v1/services/:id` — get service with ordered items
- `POST /api/v1/services` — create service plan
- `PUT /api/v1/services/:id` — update service plan
- `DELETE /api/v1/services/:id`
- `PUT /api/v1/services/:id/reorder` — update item order

### 4. Media
- `GET /api/v1/media` — list media files (images, videos, audio)
- `POST /api/v1/media/upload` — upload media file
- `DELETE /api/v1/media/:id`

### 5. AI
- `POST /api/v1/ai/translate` — translate text to target language
- `POST /api/v1/ai/suggest` — suggest songs/scriptures for a theme
- `POST /api/v1/ai/create-song` — generate song draft from prompt

### 6. Stream
- `POST /api/v1/stream/start` — initiate stream to configured platforms
- `POST /api/v1/stream/stop`
- `GET /api/v1/stream/status`

### 7. Health
- `GET /api/v1/health` — service health check with dependency statuses

---

## Real-time (Socket.io)
For remote operator sync (future feature, scaffold now):
- `presentation:update` — broadcast current slide state
- `service:update` — broadcast service plan changes
- `operator:connect` / `operator:disconnect`

---

## External Integrations

### Bible API
- Primary: api.scripture.api.bible or similar free Bible API
- Fallback: bundled offline KJV dataset
- Versions: NIV, ESV, KJV, NLT, RVR1960, ARA

### AI (Anthropic Claude)
- Translation of songs and scriptures
- Song generation from prompts
- Service theme suggestions
- Model: claude-sonnet (configurable)

### Streaming (Phase 2)
- YouTube Live API
- Facebook Live API

---

## Non-Functional Requirements
- All endpoints respond in < 200ms for local DB operations
- AI calls are async with loading state feedback
- Graceful error handling — never crash the Electron app
- API versioned from day one (`/api/v1/`)
- Request logging with Winston
- Environment-based config (dev / prod)

---

## Out of Scope for MVP
- Auth / multi-user (single operator, local only)
- Cloud sync
- Remote operator mobile app backend
