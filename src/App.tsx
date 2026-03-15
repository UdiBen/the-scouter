import { useState, useRef } from 'react'
import styles from './App.module.css'
import SearchBar from './components/SearchBar'
import PlayerCard from './components/PlayerCard'
import RecentSearches from './components/RecentSearches'
import LoadingTrivia from './components/LoadingTrivia'
import ProfileCarousel from './components/ProfileCarousel'
import { useRecentSearches } from './hooks/useRecentSearches'
import type { PlayerData, CachedPlayer } from './types'

function App() {
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { recent, addRecent, getFromCache } = useRecentSearches()
  const profileRef = useRef<HTMLDivElement>(null)

  const hasProfileData = player && (
    player.trophies?.length || player.playingStyle || player.timeline?.length ||
    player.similarPlayers?.length || player.iconicMoments?.length
  )

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
        `/api/image?q=${encodeURIComponent(data.englishName)}`
      )
      const imgData = await imgRes.json()
      const finalImageUrl = imgData.url ?? data.imageUrl ?? null
      setImageUrl(finalImageUrl)

      addRecent({
        data,
        imageUrl: finalImageUrl,
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
      {isLoading && <LoadingTrivia />}
      {player && (
        <>
          {hasProfileData && (
            <button
              className={styles.discoverBtn}
              onClick={() => profileRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              גלה עוד על השחקן ↓
            </button>
          )}
          <PlayerCard
            player={player}
            imageUrl={imageUrl}
            onDismiss={() => { setPlayer(null); setImageUrl(null) }}
          />
          {hasProfileData && (
            <div ref={profileRef}>
              <ProfileCarousel player={player} onPlayerSearch={handleSearch} />
            </div>
          )}
          <p className={styles.disclaimer}>
            * הנתונים מבוססים על AI ועשויים להיות לא מדויקים
          </p>
        </>
      )}
      {!player && !isLoading && (
        <RecentSearches recent={recent} onSelect={showPlayer} />
      )}
    </div>
  )
}

export default App
