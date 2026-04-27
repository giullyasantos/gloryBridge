# GloryBridge — Frontend Requirements

## Overview
GloryBridge is a cross-platform desktop application for church worship service management and presentation. Built with **Electron + React + TypeScript**. The frontend is the operator's control center and the presentation engine simultaneously.

## Tech Stack
- **Framework:** Electron + React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Build Tool:** Vite

---

## Core Concepts

### Two-Window Architecture
1. **Operator Window** — The control panel used by the tech operator/worship leader
2. **Presentation Window** — Full-screen output shown on the projector/display screen(s)

These communicate via Electron IPC.

---

## Screens & Components

### 1. Sidebar / Navigation
- App logo and name
- Navigation between main sections: Service Planner, Media Library, Scripture Search, Settings
- Connection status indicators (backend, stream, remote operators)

### 2. Service Planner
The main workspace. Operators build and run the service flow here.
- Ordered list of service items (songs, scriptures, announcements, videos, images)
- Drag-and-drop reordering
- Each item shows: type icon, title, duration estimate, language(s)
- "Now Playing" indicator on current item
- Next/Previous controls
- Add item button (opens media picker or creation modal)
- Service timer (elapsed / remaining)

### 3. Presentation Controls
Live control panel for the current item being displayed.
- Slide navigator (previous/next slide, current slide preview)
- Blank screen toggle (black out all outputs instantly)
- Logo/holding slide toggle
- Language toggle (English / Spanish / Portuguese or any configured language)
- Loop toggle for current item
- Extend worship button (repeats current chorus/slide)
- Font size adjustment for current output

### 4. Presentation View (Output Window)
Full-screen Electron window rendered on the secondary display.
- Renders current slide content (lyrics, scripture, announcement text, image, video)
- Supports background images/videos behind text
- Smooth transitions between slides
- Bilingual mode: split screen or stacked text
- No UI chrome — clean output only

### 5. Media Library
Browse and manage all media assets.
- Tabs: Songs, Scriptures, Images, Videos, Audio
- Search and filter
- Preview on hover/select
- Add to service button
- Edit and delete options

### 6. Song Creator Modal
Create or edit songs.
- Title, artist, language fields
- Verse/Chorus/Bridge section editor
- Per-section content (lyrics)
- Slide preview as you type
- Style configurator: font, size, color, background, text shadow, alignment
- AI-assisted translation to other languages
- Save to library

### 7. Scripture Creator / Search Modal
- Search by reference (John 3:16) or keyword
- Bible version selector: NIV, ESV, KJV, NLT, RVR1960 (Spanish), ARA (Portuguese)
- Side-by-side translation comparison
- Popular verses quick access
- Topic categories: Love, Peace, Hope, Salvation, Worship, Prayer
- Add selected verse(s) to service
- Save to library

### 8. Settings
- Display configuration (which monitor is output)
- Default language and fallback language
- Font defaults
- Stream integration keys (YouTube, Facebook)
- AI service API key configuration
- Remote operator access settings

---

## Key UX Principles
- **The "grandma test":** A 70-year-old volunteer should be able to run Sunday service solo
- Big, obvious controls for critical actions (Next, Back, Blank Screen)
- Emergency actions always visible: Black Screen, Logo/Hold
- Never more than 2 clicks to any critical function during live service
- Operator window and output window must stay in sync with zero perceptible lag

---

## Bilingual / Multilingual Support
- Every song and scripture can have multiple language versions
- Operator selects which language(s) to show on output
- Bilingual mode shows two languages simultaneously (split or stacked)
- Language switch is a single click during live service

---

## AI Features (Frontend-facing)
- Auto-translate songs/scriptures via AI service
- Suggest songs based on service theme
- Live coaching suggestions (optional, operator can dismiss)

---

## Out of Scope for MVP
- Mobile worship leader remote app
- Congregation engagement analytics
- Auto light control integration
