# Player Profile Carousel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a swipeable carousel below the player card with 5 rich content sections (trophies, playing style radar chart, career timeline, similar players, iconic moments).

**Architecture:** Expand the Gemini prompt to return new fields, add TypeScript types, build 5 section components + a carousel shell using CSS scroll-snap, and wire it into the existing App.

**Tech Stack:** React 19, TypeScript, CSS Modules, SVG (radar chart), CSS scroll-snap (carousel)

**Spec:** `docs/superpowers/specs/2026-03-15-player-profile-carousel-design.md`

---

## Chunk 1: Data Layer

### Task 1: Add new types to `src/types.ts`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add the 5 new interfaces and extend PlayerData**

Add these interfaces before `PlayerData`, and add optional fields to `PlayerData` (optional so cached data without them still works):

```ts
export interface Trophy {
  name: string
  emoji: string
  count: number
  category: 'league' | 'europe' | 'international' | 'individual'
}

export interface PlayingStyle {
  speed: number
  dribbling: number
  shooting: number
  passing: number
  defense: number
  physical: number
  description: string
}

export interface TimelineEvent {
  year: number
  event: string
}

export interface SimilarPlayer {
  name: string
  englishName: string
  flag: string
  relation: string
}

export interface IconicMoment {
  year: number
  match: string
  emoji: string
  description: string
}
```

Add to `PlayerData` (after `career`):

```ts
  trophies?: Trophy[]
  playingStyle?: PlayingStyle
  timeline?: TimelineEvent[]
  similarPlayers?: SimilarPlayer[]
  iconicMoments?: IconicMoment[]
```

- [ ] **Step 2: Verify build passes**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```
feat: add types for player profile carousel sections
```

---

### Task 2: Expand the Gemini system prompt

**Files:**
- Modify: `api/search.ts`

- [ ] **Step 1: Add new fields to the JSON schema in SYSTEM_PROMPT**

After the `"career"` array in the prompt, add:

```
  "trophies": [
    {
      "name": "שם הגביע בעברית",
      "emoji": "אמוג׳י מתאים (🏆/⭐/🥇/👟)",
      "count": מספר,
      "category": "league" | "europe" | "international" | "individual"
    }
  ],
  "playingStyle": {
    "speed": מספר 0-99,
    "dribbling": מספר 0-99,
    "shooting": מספר 0-99,
    "passing": מספר 0-99,
    "defense": מספר 0-99,
    "physical": מספר 0-99,
    "description": "תיאור סגנון המשחק בעברית, מותאם לילד בן 9"
  },
  "timeline": [
    {
      "year": מספר,
      "event": "אירוע חשוב בקריירה בעברית, אפשר לכלול אמוג׳י"
    }
  ],
  "similarPlayers": [
    {
      "name": "שם בעברית",
      "englishName": "Name in English",
      "flag": "אמוג׳י דגל",
      "relation": "סיבת הדמיון בעברית (סגנון דומה/אותו עידן/אותה עמדה)"
    }
  ],
  "iconicMoments": [
    {
      "year": מספר,
      "match": "תיאור קצר של המשחק בעברית",
      "emoji": "אמוג׳י מתאים",
      "description": "תיאור מרגש של הרגע בעברית, מותאם לילד בן 9"
    }
  ]
```

Also add these instructions at the end of the prompt (before the closing backtick):

```
כלול 3-5 רגעים איקוניים.
כלול 3 שחקנים דומים.
כלול 3-8 אירועים בציר הזמן, מהחשובים ביותר.
כלול את כל הגביעים המשמעותיים.
דירוגי סגנון המשחק צריכים להיות ריאליסטיים ולשקף את היכולות האמיתיות של השחקן.
```

- [ ] **Step 2: Test locally**

Run `vercel dev --yes`, search for a player, verify the response includes the new fields in the browser console.

- [ ] **Step 3: Commit**

```
feat: expand Gemini prompt with carousel data fields
```

---

## Chunk 2: Carousel Shell & Section Components

### Task 3: Create the ProfileCarousel component

**Files:**
- Create: `src/components/ProfileCarousel.tsx`
- Create: `src/components/ProfileCarousel.module.css`

- [ ] **Step 1: Create ProfileCarousel.module.css**

```css
.container {
  width: 100%;
  max-width: 500px;
  margin-top: 16px;
}

.tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 0 4px 12px;
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tab {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid;
  background: transparent;
  transition: background 0.2s, opacity 0.2s;
  opacity: 0.5;
}

.tab.active {
  opacity: 1;
}

.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  gap: 0;
}

.carousel::-webkit-scrollbar {
  display: none;
}

.slide {
  min-width: 100%;
  scroll-snap-align: start;
  padding: 0 2px;
  box-sizing: border-box;
}

.dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background 0.2s;
}

.dot.active {
  background: currentColor;
}
```

- [ ] **Step 2: Create ProfileCarousel.tsx**

The component accepts `PlayerData` and an `onPlayerSearch` callback (for similar players). It renders the tab bar, a scroll-snap carousel container, and dot indicators. It tracks the active index via `IntersectionObserver`.

```tsx
import { useRef, useState, useEffect } from 'react'
import styles from './ProfileCarousel.module.css'
import type { PlayerData } from '../types'
import TrophyCabinet from './TrophyCabinet'
import PlayingStyleChart from './PlayingStyleChart'
import CareerTimeline from './CareerTimeline'
import SimilarPlayers from './SimilarPlayers'
import IconicMoments from './IconicMoments'

interface Tab {
  id: string
  label: string
  color: string
  borderColor: string
}

const TABS: Tab[] = [
  { id: 'trophies', label: '🏆 גביעים', color: 'rgba(250,204,21,0.3)', borderColor: 'rgba(250,204,21,0.4)' },
  { id: 'style', label: '⚡ סגנון', color: 'rgba(34,211,238,0.15)', borderColor: 'rgba(34,211,238,0.3)' },
  { id: 'timeline', label: '📅 ציר זמן', color: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)' },
  { id: 'similar', label: '🔗 דומים', color: 'rgba(74,222,128,0.15)', borderColor: 'rgba(74,222,128,0.3)' },
  { id: 'moments', label: '🎬 רגעים', color: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.3)' },
]

const TAB_ACTIVE_COLORS: Record<string, string> = {
  trophies: '#fbbf24',
  style: '#22d3ee',
  timeline: '#a78bfa',
  similar: '#4ade80',
  moments: '#fb7185',
}

interface Props {
  player: PlayerData
  onPlayerSearch: (query: string) => void
}

export default function ProfileCarousel({ player, onPlayerSearch }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  // Filter tabs to only those with data
  const availableTabs = TABS.filter((tab) => {
    switch (tab.id) {
      case 'trophies': return player.trophies && player.trophies.length > 0
      case 'style': return player.playingStyle
      case 'timeline': return player.timeline && player.timeline.length > 0
      case 'similar': return player.similarPlayers && player.similarPlayers.length > 0
      case 'moments': return player.iconicMoments && player.iconicMoments.length > 0
      default: return false
    }
  })

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.indexOf(entry.target as HTMLDivElement)
            if (index !== -1) setActiveIndex(index)
          }
        })
      },
      { root: carousel, threshold: 0.5 }
    )

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide)
    })

    return () => observer.disconnect()
  }, [availableTabs.length])

  if (availableTabs.length === 0) return null

  const scrollToSlide = (index: number) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  const activeColor = TAB_ACTIVE_COLORS[availableTabs[activeIndex]?.id] ?? '#a78bfa'

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {availableTabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${i === activeIndex ? styles.active : ''}`}
            style={{
              background: i === activeIndex ? tab.color : 'transparent',
              borderColor: tab.borderColor,
              color: TAB_ACTIVE_COLORS[tab.id],
            }}
            onClick={() => scrollToSlide(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div ref={carouselRef} className={styles.carousel}>
        {availableTabs.map((tab, i) => (
          <div
            key={tab.id}
            ref={(el) => { slideRefs.current[i] = el }}
            className={styles.slide}
          >
            {tab.id === 'trophies' && player.trophies && <TrophyCabinet trophies={player.trophies} />}
            {tab.id === 'style' && player.playingStyle && <PlayingStyleChart style={player.playingStyle} />}
            {tab.id === 'timeline' && player.timeline && <CareerTimeline events={player.timeline} />}
            {tab.id === 'similar' && player.similarPlayers && <SimilarPlayers players={player.similarPlayers} onSearch={onPlayerSearch} />}
            {tab.id === 'moments' && player.iconicMoments && <IconicMoments moments={player.iconicMoments} />}
          </div>
        ))}
      </div>

      <div className={styles.dots}>
        {availableTabs.map((tab, i) => (
          <button
            key={tab.id}
            className={`${styles.dot} ${i === activeIndex ? styles.active : ''}`}
            style={{ color: activeColor }}
            onClick={() => scrollToSlide(i)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```
feat: add ProfileCarousel shell component with tabs and scroll-snap
```

---

### Task 4: Create TrophyCabinet component

**Files:**
- Create: `src/components/TrophyCabinet.tsx`
- Create: `src/components/TrophyCabinet.module.css`

- [ ] **Step 1: Create TrophyCabinet.module.css**

```css
.container {
  background: rgba(250, 204, 21, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(250, 204, 21, 0.15);
}

.categoryLabel {
  font-size: 11px;
  color: #fbbf24;
  margin-bottom: 8px;
}

.category {
  margin-bottom: 12px;
}

.category:last-child {
  margin-bottom: 0;
}

.trophies {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.trophy {
  background: rgba(250, 204, 21, 0.15);
  border-radius: 10px;
  padding: 10px 14px;
  text-align: center;
}

.trophyEmoji {
  font-size: 22px;
}

.trophyName {
  font-size: 11px;
  color: #fde68a;
  margin-top: 4px;
}

.trophyCount {
  font-size: 10px;
  color: #a78bfa;
}
```

- [ ] **Step 2: Create TrophyCabinet.tsx**

```tsx
import styles from './TrophyCabinet.module.css'
import type { Trophy } from '../types'

const CATEGORY_LABELS: Record<string, string> = {
  league: 'ליגה',
  europe: 'אירופה',
  international: 'בינלאומי',
  individual: 'אישי',
}

const CATEGORY_ORDER = ['league', 'europe', 'international', 'individual']

interface Props {
  trophies: Trophy[]
}

export default function TrophyCabinet({ trophies }: Props) {
  const grouped = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      items: trophies.filter((t) => t.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className={styles.container}>
      {grouped.map((group) => (
        <div key={group.category} className={styles.category}>
          <div className={styles.categoryLabel}>{CATEGORY_LABELS[group.category]}</div>
          <div className={styles.trophies}>
            {group.items.map((trophy, i) => (
              <div key={i} className={styles.trophy}>
                <div className={styles.trophyEmoji}>{trophy.emoji}</div>
                <div className={styles.trophyName}>{trophy.name}</div>
                {trophy.count > 1 && <div className={styles.trophyCount}>x{trophy.count}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```
feat: add TrophyCabinet component
```

---

### Task 5: Create PlayingStyleChart component (SVG radar)

**Files:**
- Create: `src/components/PlayingStyleChart.tsx`
- Create: `src/components/PlayingStyleChart.module.css`

- [ ] **Step 1: Create PlayingStyleChart.module.css**

```css
.container {
  background: rgba(34, 211, 238, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(34, 211, 238, 0.15);
}

.chartWrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.description {
  font-size: 12px;
  color: #a5f3fc;
  line-height: 1.6;
  background: rgba(34, 211, 238, 0.05);
  padding: 10px;
  border-radius: 8px;
  text-align: right;
}
```

- [ ] **Step 2: Create PlayingStyleChart.tsx**

Build a reusable SVG radar chart. The hexagon has 6 vertices at equal angles. Each data point is plotted as a fraction (value/99) of the distance from center to vertex.

```tsx
import styles from './PlayingStyleChart.module.css'
import type { PlayingStyle } from '../types'

const AXES = [
  { key: 'speed' as const, label: 'מהירות' },
  { key: 'dribbling' as const, label: 'כדרור' },
  { key: 'shooting' as const, label: 'בעיטה' },
  { key: 'passing' as const, label: 'מסירות' },
  { key: 'defense' as const, label: 'הגנה' },
  { key: 'physical' as const, label: 'פיזיות' },
]

const CX = 150
const CY = 150
const R = 120
const RINGS = 4

function polarToXY(angleDeg: number, radius: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)]
}

function getVertices(radius: number): [number, number][] {
  return AXES.map((_, i) => polarToXY((360 / AXES.length) * i, radius))
}

interface Props {
  style: PlayingStyle
}

export default function PlayingStyleChart({ style }: Props) {
  const outerVertices = getVertices(R)

  // Data polygon
  const dataPoints = AXES.map((axis, i) => {
    const value = style[axis.key]
    const fraction = Math.min(value, 99) / 99
    return polarToXY((360 / AXES.length) * i, R * fraction)
  })

  // Label positions (slightly outside the outer ring)
  const labelPositions = AXES.map((_, i) =>
    polarToXY((360 / AXES.length) * i, R + 22)
  )

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
        <svg viewBox="0 0 300 300" width="260" height="260" style={{ overflow: 'visible' }}>
          {/* Grid rings */}
          {Array.from({ length: RINGS }, (_, ring) => {
            const ringR = R * ((ring + 1) / RINGS)
            const verts = getVertices(ringR)
            return (
              <polygon
                key={ring}
                points={verts.map((v) => v.join(',')).join(' ')}
                fill="none"
                stroke={`rgba(34,211,238,${0.04 + ring * 0.02})`}
                strokeWidth="1"
              />
            )
          })}

          {/* Axis lines */}
          {outerVertices.map((v, i) => (
            <line key={i} x1={CX} y1={CY} x2={v[0]} y2={v[1]} stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
          ))}

          {/* Data polygon */}
          <polygon
            points={dataPoints.map((p) => p.join(',')).join(' ')}
            fill="rgba(34,211,238,0.2)"
            stroke="#22d3ee"
            strokeWidth="2"
          />

          {/* Data points */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#22d3ee" />
          ))}

          {/* Labels */}
          {AXES.map((axis, i) => {
            const [x, y] = labelPositions[i]
            const value = style[axis.key]
            return (
              <text
                key={axis.key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#67e8f9"
                fontSize="11"
                fontFamily="sans-serif"
              >
                {axis.label} {value}
              </text>
            )
          })}
        </svg>
      </div>

      <div className={styles.description}>{style.description}</div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```
feat: add PlayingStyleChart component with SVG radar chart
```

---

### Task 6: Create CareerTimeline component

**Files:**
- Create: `src/components/CareerTimeline.tsx`
- Create: `src/components/CareerTimeline.module.css`

- [ ] **Step 1: Create CareerTimeline.module.css**

```css
.container {
  background: rgba(168, 85, 247, 0.08);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(168, 85, 247, 0.15);
  direction: rtl;
}

.entry {
  display: flex;
  align-items: flex-start;
  min-height: 56px;
}

.entry:last-child {
  min-height: auto;
}

.year {
  width: 60px;
  text-align: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: bold;
  color: #c4b5fd;
}

.dotLine {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 24px;
  margin-top: 4px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #a78bfa;
  border: 2px solid #1e1b4b;
  flex-shrink: 0;
}

.entry:last-child .dot {
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #c084fc, #f0abfc);
}

.line {
  width: 2px;
  flex: 1;
  background: rgba(168, 85, 247, 0.3);
  min-height: 30px;
}

.event {
  flex: 1;
  padding-top: 4px;
  margin-right: 12px;
  font-size: 12px;
  color: #e0d5ff;
  line-height: 1.4;
  text-align: right;
}
```

- [ ] **Step 2: Create CareerTimeline.tsx**

```tsx
import styles from './CareerTimeline.module.css'
import type { TimelineEvent } from '../types'

interface Props {
  events: TimelineEvent[]
}

export default function CareerTimeline({ events }: Props) {
  return (
    <div className={styles.container}>
      {events.map((entry, i) => (
        <div key={i} className={styles.entry}>
          <div className={styles.year}>{entry.year}</div>
          <div className={styles.dotLine}>
            <div className={styles.dot} />
            {i < events.length - 1 && <div className={styles.line} />}
          </div>
          <div className={styles.event}>{entry.event}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```
feat: add CareerTimeline component with RTL layout
```

---

### Task 7: Create SimilarPlayers component

**Files:**
- Create: `src/components/SimilarPlayers.tsx`
- Create: `src/components/SimilarPlayers.module.css`

- [ ] **Step 1: Create SimilarPlayers.module.css**

```css
.container {
  background: rgba(74, 222, 128, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(74, 222, 128, 0.15);
}

.grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card {
  background: rgba(74, 222, 128, 0.1);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  min-width: 80px;
  cursor: pointer;
  border: 1px solid rgba(74, 222, 128, 0.2);
  transition: background 0.2s;
}

.card:hover {
  background: rgba(74, 222, 128, 0.2);
}

.flag {
  font-size: 28px;
}

.name {
  font-size: 12px;
  color: #86efac;
  margin-top: 4px;
}

.relation {
  font-size: 9px;
  color: #4ade80;
  margin-top: 2px;
}

.hint {
  font-size: 10px;
  color: #4ade80;
  margin-top: 10px;
  text-align: center;
}
```

- [ ] **Step 2: Create SimilarPlayers.tsx**

```tsx
import styles from './SimilarPlayers.module.css'
import type { SimilarPlayer } from '../types'

interface Props {
  players: SimilarPlayer[]
  onSearch: (query: string) => void
}

export default function SimilarPlayers({ players, onSearch }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {players.map((p, i) => (
          <button key={i} className={styles.card} onClick={() => onSearch(p.englishName)}>
            <div className={styles.flag}>{p.flag}</div>
            <div className={styles.name}>{p.name}</div>
            <div className={styles.relation}>{p.relation}</div>
          </button>
        ))}
      </div>
      <div className={styles.hint}>👆 לחץ על שחקן כדי לחפש אותו</div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```
feat: add SimilarPlayers component
```

---

### Task 8: Create IconicMoments component

**Files:**
- Create: `src/components/IconicMoments.tsx`
- Create: `src/components/IconicMoments.module.css`

- [ ] **Step 1: Create IconicMoments.module.css**

```css
.container {
  background: rgba(244, 63, 94, 0.08);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(244, 63, 94, 0.15);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.moment {
  background: rgba(244, 63, 94, 0.1);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(244, 63, 94, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.match {
  font-size: 10px;
  color: #fb7185;
}

.emoji {
  font-size: 14px;
}

.description {
  font-size: 12px;
  color: #fda4af;
  line-height: 1.5;
}
```

- [ ] **Step 2: Create IconicMoments.tsx**

```tsx
import styles from './IconicMoments.module.css'
import type { IconicMoment } from '../types'

interface Props {
  moments: IconicMoment[]
}

export default function IconicMoments({ moments }: Props) {
  return (
    <div className={styles.container}>
      {moments.map((m, i) => (
        <div key={i} className={styles.moment}>
          <div className={styles.header}>
            <span className={styles.match}>{m.year} · {m.match}</span>
            <span className={styles.emoji}>{m.emoji}</span>
          </div>
          <div className={styles.description}>{m.description}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```
feat: add IconicMoments component
```

---

## Chunk 3: Integration

### Task 9: Wire ProfileCarousel into App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.module.css`

- [ ] **Step 1: Add the "גלה עוד" button style to App.module.css**

Add at end of file:

```css
.discoverBtn {
  margin-top: 12px;
  padding: 10px 24px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.discoverBtn:hover {
  opacity: 0.85;
}
```

- [ ] **Step 2: Update App.tsx**

Import `ProfileCarousel` and add a ref for scrolling. Add the "גלה עוד" button below `PlayerCard` and render `ProfileCarousel` below it. Wire `onPlayerSearch` to trigger `handleSearch`.

Changes to `src/App.tsx`:

1. Add imports:
```tsx
import { useState, useRef } from 'react'
import ProfileCarousel from './components/ProfileCarousel'
```

2. Add ref inside the component:
```tsx
const profileRef = useRef<HTMLDivElement>(null)
```

3. Add helper to check if carousel data exists:
```tsx
const hasProfileData = player && (
  player.trophies?.length || player.playingStyle || player.timeline?.length ||
  player.similarPlayers?.length || player.iconicMoments?.length
)
```

4. Replace the `{player && (` block with:
```tsx
{player && (
  <>
    <PlayerCard
      player={player}
      imageUrl={imageUrl}
      onDismiss={() => { setPlayer(null); setImageUrl(null) }}
    />
    {hasProfileData && (
      <button
        className={styles.discoverBtn}
        onClick={() => profileRef.current?.scrollIntoView({ behavior: 'smooth' })}
      >
        גלה עוד על השחקן ↓
      </button>
    )}
    {hasProfileData && (
      <div ref={profileRef}>
        <ProfileCarousel player={player} onPlayerSearch={handleSearch} />
      </div>
    )}
  </>
)}
```

- [ ] **Step 3: Verify build passes**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Test end-to-end locally**

Run `vercel dev --yes`, search for "מסי", verify:
- Card appears as before
- "גלה עוד" button appears below card
- Clicking it scrolls to the carousel
- Tabs are swipeable, dot indicators update
- All 5 sections render with data
- Clicking a similar player triggers a new search

- [ ] **Step 5: Commit**

```
feat: wire ProfileCarousel into App with discover button
```
