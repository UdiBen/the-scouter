# The Scouter Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playful Hebrew soccer player explorer — search for a player, see a flippable collectible card with stats, trivia, career history, and photo.

**Architecture:** Vite + React + TypeScript SPA with two Vercel serverless functions (`/api/search` for Gemini player data, `/api/image` for Google Custom Search images). Static player list JSON for autocomplete. localStorage for caching and recent searches.

**Tech Stack:** Vite, React, TypeScript, CSS Modules, Vercel serverless functions, Gemini 2.5 Flash (with Google Search grounding), Google Custom Search JSON API.

---

## File Structure

```
the-scouter/
├── api/
│   ├── search.ts              # Vercel serverless: Gemini player search
│   └── image.ts               # Vercel serverless: Google Custom Search image
├── scripts/
│   └── generate-players.js    # Offline: generate player list via Gemini
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Root component, state management, API calls
│   ├── App.module.css         # App-level styles (background, layout)
│   ├── types.ts               # PlayerData, CachedPlayer interfaces
│   ├── data/
│   │   └── players.json       # Static autocomplete list (~500 players)
│   ├── components/
│   │   ├── SearchBar.tsx       # Search input + autocomplete dropdown
│   │   ├── SearchBar.module.css
│   │   ├── PlayerCard.tsx      # Flippable card (front + back)
│   │   ├── PlayerCard.module.css
│   │   ├── RecentSearches.tsx  # Recent search chips
│   │   └── RecentSearches.module.css
│   └── hooks/
│       └── useRecentSearches.ts # localStorage read/write for recent searches + cache
├── index.html                 # Vite HTML entry
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vercel.json                # Vercel config (rewrites, functions)
├── .env.example
└── .gitignore
```

---

## Chunk 1: Project Setup + API Layer

### Task 1: Scaffold Vite React TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.module.css`, `.gitignore`, `.env.example`, `vercel.json`

- [ ] **Step 1: Initialize Vite project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

Accept overwrite prompts (directory has only docs/ and .git).

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install
```

- [ ] **Step 3: Create `.env.example`**

```
GEMINI_API_KEY=
GOOGLE_CSE_API_KEY=
GOOGLE_CSE_ID=
```

- [ ] **Step 4: Create `vercel.json`**

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

- [ ] **Step 5: Update `.gitignore`**

Add to the generated `.gitignore`:
```
.env
.env.local
.superpowers/
.vercel/
```

- [ ] **Step 6: Clean up Vite boilerplate**

Remove `src/App.css`, `src/index.css`, `src/assets/`. Replace `src/App.tsx` with a minimal placeholder:

```tsx
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app} dir="rtl">
      <h1>הסקאוטר ⚽</h1>
    </div>
  )
}

export default App
```

Create `src/App.module.css`:
```css
.app {
  min-height: 100vh;
  background: #0d3b1e;
  color: white;
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}
```

Update `src/main.tsx` to remove index.css import:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Verify dev server runs**

Run: `npm run dev`
Expected: App loads at localhost with "הסקאוטר ⚽" on green background.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html vercel.json .env.example .gitignore src/main.tsx src/App.tsx src/App.module.css
git commit -m "feat: scaffold Vite React TypeScript project"
```

### Task 2: Define TypeScript types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create shared types**

```typescript
export interface PlayerCareer {
  club: string
  clubEmoji: string
  years: string
  appearances: number
  goals: number
  assists: number
}

export interface PlayerData {
  found: true
  fullName: string
  nationality: string
  nationalityFlag: string
  age: number
  position: string
  shirtNumber: number | null
  currentClub: string
  englishName: string
  funFact: string
  achievements: string
  career: PlayerCareer[]
}

export interface PlayerNotFound {
  found: false
}

export type PlayerResponse = PlayerData | PlayerNotFound

export interface CachedPlayer {
  data: PlayerData
  imageUrl: string | null
  timestamp: number
}

export interface AutocompletePlayer {
  name: string
  flag: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript type definitions"
```

### Task 3: Implement `/api/search` serverless function

**Files:**
- Create: `api/search.ts`

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install @google/generative-ai
npm install -D @vercel/node
```

- [ ] **Step 2: Create the search endpoint**

`api/search.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `אתה מומחה כדורגל. המשתמש יחפש שחקן כדורגל ואתה תחזיר מידע עליו בפורמט JSON בלבד.

החזר JSON בפורמט הבא בלבד, בלי טקסט נוסף:
{
  "found": true,
  "fullName": "שם מלא בעברית",
  "nationality": "שם המדינה בעברית",
  "nationalityFlag": "אמוג׳י דגל",
  "age": מספר,
  "position": "עמדה בעברית (שוער/מגן/קשר/חלוץ)",
  "shirtNumber": מספר או null,
  "currentClub": "שם הקבוצה הנוכחית בעברית",
  "englishName": "Full name in English",
  "funFact": "עובדה מעניינת ומפתיעה על השחקן בעברית, מותאמת לילד בן 9",
  "achievements": "הישגים עיקריים מופרדים ב-· בעברית",
  "career": [
    {
      "club": "שם קבוצה בעברית",
      "clubEmoji": "אמוג׳י צבע הקבוצה",
      "years": "שנה-שנה",
      "appearances": מספר,
      "goals": מספר,
      "assists": מספר
    }
  ]
}

כלול את כל הקבוצות שהשחקן שיחק בהן כולל נבחרת לאומית.
שורת הנבחרת הלאומית תהיה אחרונה ברשימה.
אם השחקן לא נמצא החזר: {"found": false}
כל הטקסט חייב להיות בעברית מלבד englishName.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query } = req.body
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing query' })
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: query }] }],
      tools: [{ googleSearch: {} }],
    })

    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Retry once on bad JSON
      const retry = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: query }] }],
        tools: [{ googleSearch: {} }],
      })
      const retryText = retry.response.text()
      const retryMatch = retryText.match(/\{[\s\S]*\}/)
      if (!retryMatch) {
        return res.status(500).json({ error: 'Invalid response format' })
      }
      return res.status(200).json(JSON.parse(retryMatch[0]))
    }

    const data = JSON.parse(jsonMatch[0])
    return res.status(200).json(data)
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({ error: 'Search failed' })
  }
}
```

- [ ] **Step 3: Set up local `.env`**

Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```
Edit `.env` and add your `GEMINI_API_KEY`, `GOOGLE_CSE_API_KEY`, and `GOOGLE_CSE_ID`.

- [ ] **Step 4: Test locally with curl**

Run: `npx vercel dev`

In another terminal:
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "מסי"}'
```

Expected: JSON response with Messi's data in Hebrew.

- [ ] **Step 5: Commit**

```bash
git add api/search.ts package.json package-lock.json
git commit -m "feat: add /api/search Gemini serverless function"
```

### Task 4: Implement `/api/image` serverless function

**Files:**
- Create: `api/image.ts`

- [ ] **Step 1: Create the image endpoint**

`api/image.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const q = req.query.q
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ url: null })
  }

  try {
    const params = new URLSearchParams({
      key: process.env.GOOGLE_CSE_API_KEY!,
      cx: process.env.GOOGLE_CSE_ID!,
      q: `${q} soccer player photo`,
      searchType: 'image',
      num: '1',
    })

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`
    )

    if (!response.ok) {
      return res.status(200).json({ url: null })
    }

    const data = await response.json()
    const url = data.items?.[0]?.link ?? null
    return res.status(200).json({ url })
  } catch (error) {
    console.error('Image search error:', error)
    return res.status(200).json({ url: null })
  }
}
```

Note: errors return `{ url: null }` (not 500) so the frontend gracefully falls back to the default avatar.

- [ ] **Step 2: Test locally with curl**

Add `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_ID` to `.env`. Then:

Run: `npx vercel dev` (if not already running)

```bash
curl "http://localhost:3000/api/image?q=Lionel+Messi"
```

Expected: JSON with `{ "url": "https://..." }`.

- [ ] **Step 3: Commit**

```bash
git add api/image.ts
git commit -m "feat: add /api/image Google Custom Search serverless function"
```

---

## Chunk 2: Frontend Components

### Task 5: Build the SearchBar component with autocomplete

**Files:**
- Create: `src/components/SearchBar.tsx`, `src/components/SearchBar.module.css`
- Create: `src/data/players.json` (seed with a small test list for now)

- [ ] **Step 1: Create a seed `players.json`**

`src/data/players.json`:
```json
[
  { "name": "ליונל מסי", "flag": "🇦🇷" },
  { "name": "קיליאן מבאפה", "flag": "🇫🇷" },
  { "name": "ארלינג האלאנד", "flag": "🇳🇴" },
  { "name": "ג׳וד בלינגהאם", "flag": "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { "name": "וויניסיוס ג׳וניור", "flag": "🇧🇷" },
  { "name": "עומר אצילי", "flag": "🇮🇱" }
]
```

- [ ] **Step 2: Create `SearchBar.tsx`**

```tsx
import { useState, useRef, useEffect } from 'react'
import styles from './SearchBar.module.css'
import players from '../data/players.json'
import type { AutocompletePlayer } from '../types'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading: boolean
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompletePlayer[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    const filtered = (players as AutocompletePlayer[]).filter((p) =>
      p.name.includes(query)
    )
    setSuggestions(filtered.slice(0, 8))
    setSelectedIndex(-1)
  }, [query])

  const handleSubmit = (value?: string) => {
    const searchQuery = value ?? query
    if (!searchQuery.trim()) return
    onSearch(searchQuery.trim())
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        setQuery(suggestions[selectedIndex].name)
        handleSubmit(suggestions[selectedIndex].name)
      } else {
        handleSubmit()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <button
          className={styles.searchButton}
          onClick={() => handleSubmit()}
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '🔍'}
        </button>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="...הקלד שם שחקן"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          disabled={isLoading}
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map((player, index) => (
            <li
              key={player.name}
              className={`${styles.suggestion} ${index === selectedIndex ? styles.selected : ''}`}
              onMouseDown={() => {
                setQuery(player.name)
                handleSubmit(player.name)
              }}
            >
              {player.name} {player.flag}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `SearchBar.module.css`**

```css
.container {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.inputRow {
  display: flex;
  gap: 8px;
}

.input {
  flex: 1;
  padding: 14px 20px;
  border-radius: 24px;
  border: 2px solid #7c3aed;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-align: right;
  font-size: 16px;
  outline: none;
  backdrop-filter: blur(4px);
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #a78bfa;
}

.input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.searchButton {
  background: linear-gradient(135deg, #4ade80, #22d3ee);
  color: #000;
  border: none;
  border-radius: 24px;
  padding: 14px 22px;
  font-weight: bold;
  cursor: pointer;
  font-size: 18px;
  transition: opacity 0.2s;
}

.searchButton:hover {
  opacity: 0.9;
}

.searchButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #1e1b4b;
  border: 1px solid #7c3aed;
  border-radius: 16px;
  list-style: none;
  margin: 0;
  padding: 8px 0;
  z-index: 10;
  overflow: hidden;
}

.suggestion {
  padding: 10px 20px;
  cursor: pointer;
  text-align: right;
  color: #e0d5ff;
  font-size: 15px;
  transition: background 0.15s;
}

.suggestion:hover,
.selected {
  background: rgba(124, 58, 237, 0.3);
}
```

- [ ] **Step 4: Wire SearchBar into App.tsx**

Update `src/App.tsx`:

```tsx
import { useState } from 'react'
import styles from './App.module.css'
import SearchBar from './components/SearchBar'
import type { PlayerData } from './types'

function App() {
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setPlayer(null)
    setImageUrl(null)

    try {
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await searchRes.json()

      if (!data.found) {
        setError('לא מצאנו את השחקן, נסה שוב 🤷')
        return
      }

      setPlayer(data)

      const imgRes = await fetch(
        `/api/image?q=${encodeURIComponent(data.englishName + ' soccer player')}`
      )
      const imgData = await imgRes.json()
      setImageUrl(imgData.url)
    } catch {
      setError('משהו השתבש, נסה שוב 😕')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.app} dir="rtl">
      <div className={styles.logo}>⚽</div>
      <h1 className={styles.title}>הסקאוטר</h1>
      <p className={styles.subtitle}>מצא את השחקן שלך 🔎</p>
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      {error && <p className={styles.error}>{error}</p>}
      {player && <p style={{ color: 'white' }}>נמצא: {player.fullName}</p>}
    </div>
  )
}

export default App
```

- [ ] **Step 5: Update `App.module.css` with field background and layout**

```css
.app {
  min-height: 100vh;
  background:
    linear-gradient(135deg, #0d3b1e 25%, #14532d 50%, #0d3b1e 75%);
  color: white;
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  position: relative;
}

.app::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(0deg, transparent 49.5%, rgba(255,255,255,0.05) 49.5%, rgba(255,255,255,0.05) 50.5%, transparent 50.5%),
    radial-gradient(circle at 50% 50%, transparent 18%, rgba(255,255,255,0.04) 18%, rgba(255,255,255,0.04) 18.5%, transparent 18.5%);
  pointer-events: none;
}

.logo {
  font-size: 56px;
  margin-bottom: 8px;
}

.title {
  font-size: 36px;
  font-weight: 900;
  margin: 0;
  background: linear-gradient(90deg, #4ade80, #22d3ee, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #c4b5fd;
  font-size: 16px;
  margin: 8px 0 24px;
}

.error {
  color: #fca5a5;
  margin-top: 16px;
  font-size: 15px;
  background: rgba(239, 68, 68, 0.1);
  padding: 12px 24px;
  border-radius: 16px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
```

- [ ] **Step 6: Verify search + autocomplete works**

Run: `npm run dev`
Type "מס" in the input — should see autocomplete suggestions.

- [ ] **Step 7: Commit**

```bash
git add src/components/SearchBar.tsx src/components/SearchBar.module.css src/data/players.json src/App.tsx src/App.module.css
git commit -m "feat: add SearchBar component with autocomplete"
```

### Task 6: Build the PlayerCard component (front + back with flip)

**Files:**
- Create: `src/components/PlayerCard.tsx`, `src/components/PlayerCard.module.css`

- [ ] **Step 1: Create `PlayerCard.tsx`**

```tsx
import { useState, useRef, useEffect } from 'react'
import styles from './PlayerCard.module.css'
import type { PlayerData } from '../types'

interface PlayerCardProps {
  player: PlayerData
  imageUrl: string | null
}

export default function PlayerCard({ player, imageUrl }: PlayerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState(400)

  useEffect(() => {
    const updateHeight = () => {
      const frontH = frontRef.current?.scrollHeight ?? 0
      const backH = backRef.current?.scrollHeight ?? 0
      setCardHeight(Math.max(frontH, backH))
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [player])

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.card} ${isFlipped ? styles.flipped : ''}`}
        style={{ height: cardHeight }}
        onClick={() => setIsFlipped((f) => !f)}
      >
        {/* Front */}
        <div ref={frontRef} className={styles.front}>
          <button
            className={styles.flipHint}
            onClick={(e) => {
              e.stopPropagation()
              setIsFlipped(true)
            }}
          >
            👆 הפוך
          </button>

          <div className={styles.photoContainer}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={player.fullName}
                className={styles.photo}
              />
            ) : (
              <span className={styles.photoFallback}>⚽</span>
            )}
          </div>

          <h2 className={styles.name}>{player.fullName}</h2>
          <p className={styles.nationality}>
            {player.nationalityFlag} {player.nationality}
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{player.age}</span>
              <span className={styles.statLabel}>גיל</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{player.position}</span>
              <span className={styles.statLabel}>עמדה</span>
            </div>
            {player.shirtNumber != null && (
              <div className={styles.stat}>
                <span className={styles.statValue}>{player.shirtNumber}</span>
                <span className={styles.statLabel}>מספר</span>
              </div>
            )}
          </div>

          <div className={styles.funFact}>
            <span className={styles.funFactLabel}>💡 הידעת?</span>
            <p className={styles.funFactText}>{player.funFact}</p>
          </div>
        </div>

        {/* Back */}
        <div ref={backRef} className={styles.back}>
          <button
            className={styles.flipHint}
            onClick={(e) => {
              e.stopPropagation()
              setIsFlipped(false)
            }}
          >
            👆 הפוך
          </button>

          <h2 className={styles.name}>{player.fullName}</h2>
          <p className={styles.careerTitle}>⚽ קריירה</p>

          <div className={styles.careerTable}>
            <div className={styles.careerHeader}>
              <span>בישולים</span>
              <span>שערים</span>
              <span>הופעות</span>
              <span>שנים</span>
              <span className={styles.clubCol}>קבוצה</span>
            </div>
            {player.career.map((entry, i) => {
              const isNational = i === player.career.length - 1
              return (
                <div
                  key={`${entry.club}-${entry.years}`}
                  className={`${styles.careerRow} ${isNational ? styles.nationalRow : ''}`}
                >
                  <span>{entry.assists}</span>
                  <span>{entry.goals}</span>
                  <span>{entry.appearances}</span>
                  <span className={styles.years}>{entry.years}</span>
                  <span className={styles.clubCol}>
                    {entry.clubEmoji} {entry.club}
                  </span>
                </div>
              )
            })}
          </div>

          <div className={styles.achievements}>
            <span className={styles.achievementsLabel}>🏆 הישגים</span>
            <p className={styles.achievementsText}>{player.achievements}</p>
          </div>
        </div>
      </div>

      <p className={styles.disclaimer}>
        * הנתונים מבוססים על AI ועשויים להיות לא מדויקים
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create `PlayerCard.module.css`**

```css
.wrapper {
  width: 100%;
  max-width: 380px;
  margin-top: 24px;
  perspective: 1000px;
}

.card {
  position: relative;  /* needed for absolutely positioned front/back faces */
  width: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
  cursor: pointer;
}

.flipped {
  transform: rotateY(180deg);
}

.front,
.back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background: linear-gradient(135deg, #1e1b4b, #312e81);
  border-radius: 24px;
  padding: 28px 24px;
  border: 2px solid rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.2);
}

.back {
  transform: rotateY(180deg);
}

.flipHint {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 12px;
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
}

.photoContainer {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #7c3aed, #4ade80);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
  overflow: hidden;
}

.photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.photoFallback {
  font-size: 44px;
}

.name {
  text-align: center;
  font-size: 24px;
  font-weight: 900;
  margin: 0;
}

.nationality {
  text-align: center;
  color: #c4b5fd;
  font-size: 14px;
  margin: 4px 0 16px;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 16px 0;
}

.stat {
  background: rgba(124, 58, 237, 0.2);
  padding: 12px 18px;
  border-radius: 16px;
  text-align: center;
  min-width: 64px;
}

.statValue {
  display: block;
  font-size: 22px;
  font-weight: bold;
  color: #4ade80;
}

.statLabel {
  display: block;
  font-size: 11px;
  color: #c4b5fd;
  margin-top: 4px;
}

.funFact {
  background: rgba(250, 204, 21, 0.1);
  border-radius: 16px;
  padding: 12px 16px;
  margin-top: 16px;
  border: 1px solid rgba(250, 204, 21, 0.2);
}

.funFactLabel {
  font-size: 12px;
  color: #fbbf24;
}

.funFactText {
  font-size: 13px;
  color: #e0d5ff;
  margin: 6px 0 0;
}

.careerTitle {
  text-align: center;
  color: #a78bfa;
  font-size: 14px;
  margin: 4px 0 16px;
}

.careerTable {
  font-size: 13px;
}

.careerHeader {
  display: flex;
  justify-content: space-between;
  padding: 10px 8px;
  border-radius: 12px;
  background: rgba(124, 58, 237, 0.15);
  color: #a78bfa;
  font-size: 11px;
  margin-bottom: 6px;
}

.careerHeader span {
  width: 50px;
  text-align: center;
}

.clubCol {
  min-width: 90px;
  text-align: right !important;
}

.careerRow {
  display: flex;
  justify-content: space-between;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  color: #e0d5ff;
  align-items: center;
}

.careerRow span {
  width: 50px;
  text-align: center;
}

.nationalRow {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.05);
  border-radius: 12px;
  border-bottom: none;
  margin-top: 4px;
}

.years {
  font-size: 10px;
  color: #a78bfa;
}

.nationalRow .years {
  color: #4ade80;
}

.achievements {
  background: rgba(250, 204, 21, 0.1);
  border-radius: 16px;
  padding: 12px 16px;
  margin-top: 16px;
  border: 1px solid rgba(250, 204, 21, 0.2);
}

.achievementsLabel {
  font-size: 12px;
  color: #fbbf24;
}

.achievementsText {
  font-size: 13px;
  color: #e0d5ff;
  margin: 6px 0 0;
}

.disclaimer {
  text-align: center;
  font-size: 10px;
  color: rgba(167, 139, 250, 0.4);
  margin-top: 12px;
}
```

- [ ] **Step 3: Wire PlayerCard into App.tsx**

Add to imports in `App.tsx`:
```tsx
import PlayerCard from './components/PlayerCard'
```

Replace `{player && <p style={{ color: 'white' }}>נמצא: {player.fullName}</p>}` with:
```tsx
{player && <PlayerCard player={player} imageUrl={imageUrl} />}
```

- [ ] **Step 4: Verify card renders and flips**

Run: `npm run dev`
Search for a player. Card should appear with data. Click to flip — should show career stats on back.

- [ ] **Step 5: Commit**

```bash
git add src/components/PlayerCard.tsx src/components/PlayerCard.module.css src/App.tsx
git commit -m "feat: add flippable PlayerCard component"
```

### Task 7: Build the RecentSearches component

**Files:**
- Create: `src/components/RecentSearches.tsx`, `src/components/RecentSearches.module.css`
- Create: `src/hooks/useRecentSearches.ts`

- [ ] **Step 1: Create `useRecentSearches.ts` hook**

```typescript
import { useState, useCallback } from 'react'
import type { CachedPlayer } from '../types'

const STORAGE_KEY = 'the-scouter-recent'
const MAX_RECENT = 10

function loadRecent(): CachedPlayer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(players: CachedPlayer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<CachedPlayer[]>(loadRecent)

  const addRecent = useCallback(
    (player: CachedPlayer) => {
      const filtered = recent.filter(
        (p) => p.data.fullName !== player.data.fullName
      )
      const updated = [player, ...filtered].slice(0, MAX_RECENT)
      setRecent(updated)
      saveRecent(updated)
    },
    [recent]
  )

  const getFromCache = useCallback(
    (name: string): CachedPlayer | undefined => {
      return recent.find(
        (p) => p.data.fullName === name || p.data.fullName.includes(name)
      )
    },
    [recent]
  )

  return { recent, addRecent, getFromCache }
}
```

- [ ] **Step 2: Create `RecentSearches.tsx`**

```tsx
import styles from './RecentSearches.module.css'
import type { CachedPlayer } from '../types'

interface RecentSearchesProps {
  recent: CachedPlayer[]
  onSelect: (player: CachedPlayer) => void
}

export default function RecentSearches({
  recent,
  onSelect,
}: RecentSearchesProps) {
  if (recent.length === 0) return null

  return (
    <div className={styles.container}>
      <p className={styles.label}>⭐ חיפושים אחרונים</p>
      <div className={styles.chips}>
        {recent.map((cached) => (
          <button
            key={cached.data.fullName}
            className={styles.chip}
            onClick={() => onSelect(cached)}
          >
            {cached.data.nationalityFlag} {cached.data.fullName}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `RecentSearches.module.css`**

```css
.container {
  width: 100%;
  max-width: 400px;
  margin-top: 24px;
  text-align: right;
}

.label {
  color: #a78bfa;
  font-size: 14px;
  margin: 0 0 10px;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.chip {
  background: linear-gradient(
    135deg,
    rgba(168, 85, 247, 0.3),
    rgba(99, 102, 241, 0.3)
  );
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #e0d5ff;
  border: 1px solid rgba(168, 85, 247, 0.3);
  cursor: pointer;
  transition: background 0.2s;
}

.chip:hover {
  background: linear-gradient(
    135deg,
    rgba(168, 85, 247, 0.5),
    rgba(99, 102, 241, 0.5)
  );
}
```

- [ ] **Step 4: Wire RecentSearches + caching into App.tsx**

Update `App.tsx` to use the hook and show recent searches:

```tsx
import { useState } from 'react'
import styles from './App.module.css'
import SearchBar from './components/SearchBar'
import PlayerCard from './components/PlayerCard'
import RecentSearches from './components/RecentSearches'
import { useRecentSearches } from './hooks/useRecentSearches'
import type { PlayerData, CachedPlayer } from './types'

function App() {
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { recent, addRecent, getFromCache } = useRecentSearches()

  const showPlayer = (cached: CachedPlayer) => {
    setPlayer(cached.data)
    setImageUrl(cached.imageUrl)
    setError(null)
  }

  const handleSearch = async (query: string) => {
    const cached = getFromCache(query)
    if (cached) {
      showPlayer(cached)
      return
    }

    setIsLoading(true)
    setError(null)
    setPlayer(null)
    setImageUrl(null)

    try {
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await searchRes.json()

      if (!data.found) {
        setError('לא מצאנו את השחקן, נסה שוב 🤷')
        return
      }

      setPlayer(data)

      const imgRes = await fetch(
        `/api/image?q=${encodeURIComponent(data.englishName + ' soccer player')}`
      )
      const imgData = await imgRes.json()
      setImageUrl(imgData.url)

      addRecent({
        data,
        imageUrl: imgData.url,
        timestamp: Date.now(),
      })
    } catch {
      setError('משהו השתבש, נסה שוב 😕')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.app} dir="rtl">
      <div className={styles.logo}>⚽</div>
      <h1 className={styles.title}>הסקאוטר</h1>
      <p className={styles.subtitle}>מצא את השחקן שלך 🔎</p>
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />
      {error && <p className={styles.error}>{error}</p>}
      {player && <PlayerCard player={player} imageUrl={imageUrl} />}
      {!player && !isLoading && (
        <RecentSearches recent={recent} onSelect={showPlayer} />
      )}
    </div>
  )
}

export default App
```

- [ ] **Step 5: Verify end-to-end flow**

Run: `npx vercel dev`
1. Search for a player → card appears
2. Search for another → first appears in recent searches
3. Click a recent search chip → card loads instantly from cache
4. Refresh page → recent searches persist

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useRecentSearches.ts src/components/RecentSearches.tsx src/components/RecentSearches.module.css src/App.tsx
git commit -m "feat: add RecentSearches component with localStorage caching"
```

---

## Chunk 3: Player List Generation + Deployment

### Task 8: Create the player list generation script

**Files:**
- Create: `scripts/generate-players.js`
- Modify: `package.json` (add script)

- [ ] **Step 1: Create `scripts/generate-players.js`**

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'src', 'data', 'players.json')

const LEAGUES = [
  { name: 'Premier League', nameHe: 'פרמייר ליג' },
  { name: 'La Liga', nameHe: 'לה ליגה' },
  { name: 'Ligue 1', nameHe: 'ליג 1' },
  { name: 'Serie A', nameHe: 'סריה א' },
  { name: 'Bundesliga', nameHe: 'בונדסליגה' },
  { name: 'Israeli Premier League', nameHe: 'ליגת העל הישראלית' },
]

const PROMPT = (league) => `
תן לי רשימה של 80-100 שחקני כדורגל בולטים ב-${league.name} (${league.nameHe}) לעונה הנוכחית.

החזר JSON בלבד, בלי טקסט נוסף, בפורמט הבא:
[
  { "name": "שם השחקן בעברית", "flag": "אמוג׳י דגל המדינה" }
]

חשוב:
- שמות בעברית בלבד
- כלול שחקנים מכל הקבוצות בליגה
- אמוג׳י דגל לאום השחקן (לא דגל הליגה)
`

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY environment variable')
    process.exit(1)
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const allPlayers = []
  const seen = new Set()

  for (const league of LEAGUES) {
    console.log(`Fetching ${league.name}...`)
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: PROMPT(league) }] }],
        tools: [{ googleSearch: {} }],
      })
      const text = result.response.text()
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.error(`Failed to parse ${league.name} response`)
        continue
      }
      const players = JSON.parse(jsonMatch[0])
      for (const player of players) {
        if (!seen.has(player.name)) {
          seen.add(player.name)
          allPlayers.push(player)
        }
      }
      console.log(`  Got ${players.length} players (${allPlayers.length} total unique)`)
    } catch (error) {
      console.error(`Error fetching ${league.name}:`, error.message)
    }
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(allPlayers, null, 2), 'utf-8')
  console.log(`\nDone! Wrote ${allPlayers.length} players to ${OUTPUT_PATH}`)
}

main()
```

- [ ] **Step 2: Add script to `package.json`**

Add to the `"scripts"` section:
```json
"generate-players": "node --env-file=.env scripts/generate-players.js"
```

Verify `"type": "module"` exists in `package.json` (Vite's react-ts template adds it). The ESM imports in the script depend on it.

- [ ] **Step 3: Run the script**

Run (requires `.env` with `GEMINI_API_KEY` from Task 3 Step 3):
```bash
npm run generate-players
```

Expected: `src/data/players.json` updated with ~500 players. Verify a few entries look correct.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-players.js src/data/players.json package.json
git commit -m "feat: add player list generation script and populate players.json"
```

### Task 9: Deploy to Vercel

**Files:**
- No new files

- [ ] **Step 1: Verify build works**

Run:
```bash
npm run build
```

Expected: Successful build in `dist/`.

- [ ] **Step 2: Set environment variables on Vercel**

```bash
echo "$GEMINI_API_KEY" | npx vercel env add GEMINI_API_KEY production preview development
echo "$GOOGLE_CSE_API_KEY" | npx vercel env add GOOGLE_CSE_API_KEY production preview development
echo "$GOOGLE_CSE_ID" | npx vercel env add GOOGLE_CSE_ID production preview development
```

Alternatively, set them via the Vercel dashboard under Settings → Environment Variables.

- [ ] **Step 3: Deploy to production**

```bash
npx vercel --prod
```

- [ ] **Step 4: Test production**

Open the Vercel deployment URL. Search for a player — should work end to end.

- [ ] **Step 5: Commit**

```bash
git add vercel.json
git commit -m "chore: configure Vercel deployment"
```
