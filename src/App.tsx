import { useState } from 'react'
import styles from './App.module.css'
import SearchBar from './components/SearchBar'
import type { PlayerData } from './types'

function App() {
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [_imageUrl, setImageUrl] = useState<string | null>(null)
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
