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
            {cached.data.nationalityFlag} {cached.data.displayName || cached.data.fullName}
          </button>
        ))}
      </div>
    </div>
  )
}
