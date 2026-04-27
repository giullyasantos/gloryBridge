# GloryBridge — Database Requirements

## Overview
GloryBridge uses **SQLite** as its embedded database — no server required, works fully offline, ships inside the Electron app. Access is through **Prisma ORM** for type-safe queries and easy migrations.

## Tech Stack
- **Database:** SQLite
- **ORM:** Prisma
- **Location:** User's app data directory (platform-specific)

---

## Schema

### Song
```
Song {
  id          String   @id @default(cuid())
  title       String
  artist      String?
  language    String   // primary language code: "en", "es", "pt"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  slides      SongSlide[]
  translations SongTranslation[]
  serviceItems ServiceItem[]
}
```

### SongSlide
Individual slides within a song (verse, chorus, bridge, etc.)
```
SongSlide {
  id        String  @id @default(cuid())
  songId    String
  type      String  // "verse" | "chorus" | "bridge" | "pre-chorus" | "outro" | "intro"
  label     String  // "Verse 1", "Chorus", etc.
  content   String  // lyrics text
  order     Int
  
  song      Song    @relation(...)
}
```

### SongTranslation
Translated version of a song in another language.
```
SongTranslation {
  id        String  @id @default(cuid())
  songId    String
  language  String  // "es", "pt", etc.
  title     String
  slides    Json    // array of { slideId, content } — matches original structure

  song      Song    @relation(...)
}
```

### SongStyle
Visual styling config per song (or global default).
```
SongStyle {
  id              String  @id @default(cuid())
  songId          String? @unique  // null = global default
  backgroundColor String  @default("#000000")
  backgroundImage String? // file path
  fontFamily      String  @default("Inter")
  fontSize        Int     @default(48)
  fontColor       String  @default("#FFFFFF")
  textAlign       String  @default("center")
  fontWeight      String  @default("normal")
  textShadow      Boolean @default(true)
  shadowColor     String  @default("#000000")
  lineHeight      Float   @default(1.4)
  letterSpacing   Float   @default(0)
}
```

### Scripture
```
Scripture {
  id        String   @id @default(cuid())
  reference String   // "John 3:16"
  book      String
  chapter   Int
  verseStart Int
  verseEnd   Int?
  version   String   // "NIV", "ESV", etc.
  text      String
  language  String
  createdAt DateTime @default(now())

  serviceItems ServiceItem[]
}
```

### MediaFile
```
MediaFile {
  id        String   @id @default(cuid())
  type      String   // "image" | "video" | "audio"
  title     String
  filePath  String   // absolute local path
  mimeType  String
  sizeBytes Int
  createdAt DateTime @default(now())

  serviceItems ServiceItem[]
}
```

### ServicePlan
```
ServicePlan {
  id          String   @id @default(cuid())
  title       String   // "Sunday Morning - Jan 5"
  date        DateTime?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items       ServiceItem[]
}
```

### ServiceItem
Ordered item in a service plan. Polymorphic — points to one of: song, scripture, media, announcement.
```
ServiceItem {
  id            String   @id @default(cuid())
  servicePlanId String
  order         Int
  type          String   // "song" | "scripture" | "media" | "announcement" | "blank"
  
  songId        String?
  scriptureId   String?
  mediaFileId   String?
  announcementText String?  // for inline announcements

  durationSecs  Int?     // estimated display duration
  notes         String?  // operator notes

  servicePlan   ServicePlan @relation(...)
  song          Song?       @relation(...)
  scripture     Scripture?  @relation(...)
  mediaFile     MediaFile?  @relation(...)
}
```

### AppSettings
Key-value store for app configuration.
```
AppSettings {
  key   String @id
  value String
}
```

**Keys include:**
- `display.outputMonitorIndex`
- `display.defaultLanguage`
- `display.fallbackLanguage`
- `ai.apiKey`
- `stream.youtubeKey`
- `stream.facebookKey`
- `presentation.defaultFontSize`

---

## Migrations
- Use Prisma migrations (`prisma migrate dev`)
- Migrations run automatically on app startup
- Never destructive without explicit confirmation

---

## Seeding
On first run, seed with:
- 5–10 sample songs (English + Spanish translations)
- 10–15 popular scriptures in multiple versions
- Default SongStyle (global)
- Default AppSettings

---

## Indexes
- `Song.title` — for search
- `Scripture.reference` — for lookup
- `ServiceItem.servicePlanId + order` — for plan rendering
- `MediaFile.type` — for library filtering
