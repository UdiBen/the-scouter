# Player Profile Carousel

## Summary

Add a swipeable carousel below the existing player card with 5 rich content sections: Trophy Cabinet, Playing Style (spider chart), Career Timeline, Similar Players, and Iconic Moments. The card remains the "reveal" moment; the carousel provides depth.

## User Flow

1. User searches for a player → card appears (unchanged)
2. Below the card, a "גלה עוד על השחקן" button appears
3. Tapping it smooth-scrolls to the carousel, which renders below the card
4. Carousel has a tab bar at top + swipe navigation + dot indicators

## Carousel Sections

### 1. 🏆 ארון הגביעים (Trophy Cabinet)

Trophies grouped by category with emoji badges and counts.

**Categories:** League, European, International (national team), Individual awards.

**Data shape:**
```ts
interface Trophy {
  name: string        // e.g. "לה ליגה"
  emoji: string       // e.g. "🏆"
  count: number
  category: 'league' | 'europe' | 'international' | 'individual'
}
```

### 2. ⚡ סגנון משחק (Playing Style)

SVG spider/radar chart with 6 axes + text description.

**Axes:** speed (מהירות), dribbling (כדרור), shooting (בעיטה), passing (מסירות), defense (הגנה), physical (פיזיות). Values 0-99.

**Data shape:**
```ts
interface PlayingStyle {
  speed: number
  dribbling: number
  shooting: number
  passing: number
  defense: number
  physical: number
  description: string  // Hebrew text description of playing style
}
```

### 3. 📅 ציר זמן (Career Timeline)

Vertical RTL timeline. Each entry has year on the right, dot in center, event description on the left.

**Layout:** `direction: rtl`, flex row per entry: year (60px) | dot+line (24px) | event (flex: 1, margin-right: 12px). Dot+line container has margin-top: 4px, event has padding-top: 4px.

**Data shape:**
```ts
interface TimelineEvent {
  year: number
  event: string  // Hebrew, may include emoji
}
```

### 4. 🔗 שחקנים דומים (Similar Players)

Tappable player cards showing flag + name + relation type. Tapping triggers a new search for that player.

**Data shape:**
```ts
interface SimilarPlayer {
  name: string          // Hebrew display name
  englishName: string   // For search query
  flag: string          // Emoji flag
  relation: string      // e.g. "סגנון דומה", "אותו עידן", "אגדה דומה"
}
```

### 5. 🎬 רגעים איקוניים (Iconic Moments)

Vivid descriptions of legendary career moments, written for a 9-year-old audience.

**Data shape:**
```ts
interface IconicMoment {
  year: number
  match: string     // e.g. "ברצלונה נגד ריאל מדריד"
  emoji: string     // e.g. "🔥", "⭐"
  description: string  // Hebrew, vivid and kid-friendly
}
```

## Data / API Changes

Expand the Gemini system prompt in `api/search.ts` to include all new fields. Single API call returns everything — no extra round trips.

**New fields on `PlayerData`:**
```ts
trophies: Trophy[]
playingStyle: PlayingStyle
timeline: TimelineEvent[]
similarPlayers: SimilarPlayer[]
iconicMoments: IconicMoment[]
```

**Type updates in `src/types.ts`:** Add the 5 new interfaces and the new fields on `PlayerData`.

**Cache compatibility:** Existing localStorage cache entries won't have the new fields. The carousel sections should gracefully handle missing data (don't render a tab if its data is absent). This way cached players still work — they just won't show the carousel until re-searched.

## Components

### New Components

- **`PlayerProfile`** — wrapper that renders below the card, contains the tab bar + carousel
- **`ProfileCarousel`** — tab bar + swipeable content area + dot indicators
- **`TrophyCabinet`** — renders grouped trophy badges
- **`PlayingStyleChart`** — SVG radar chart + description text
- **`CareerTimeline`** — RTL vertical timeline
- **`SimilarPlayers`** — tappable player cards grid
- **`IconicMoments`** — moment cards list

### Existing Component Changes

- **`PlayerCard`** — no changes to the card itself
- **`App`** — render `PlayerProfile` below `PlayerCard` when player data includes the new fields, wire up "גלה עוד" button scroll behavior, wire `SimilarPlayers` tap to trigger search

## Carousel Implementation

Use CSS scroll-snap for the swipe behavior (no library needed):
- Container: `overflow-x: auto; scroll-snap-type: x mandatory; scroll-behavior: smooth`
- Each section: `scroll-snap-align: start; min-width: 100%`
- Tab clicks scroll to the corresponding section
- IntersectionObserver or scroll event to update active tab + dot indicators
- Touch swipe works natively with scroll-snap

## Visual Design

Matches the existing app's dark purple/indigo theme. Each section has its own accent color:
- Trophies: gold/yellow (`rgba(250,204,21,*)`)
- Playing Style: cyan (`rgba(34,211,238,*)`)
- Timeline: purple (`rgba(168,85,247,*)`)
- Similar Players: green (`rgba(74,222,128,*)`)
- Iconic Moments: rose/red (`rgba(244,63,94,*)`)

All text in Hebrew. RTL layout throughout.
